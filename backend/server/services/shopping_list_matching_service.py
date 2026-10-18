import logging

from server.models.group_models import StoredGroup
from server.models.shopping_list_models import (
    GroupItemMatches,
    MatchableReceiptItem,
    MatchItemsRequest,
    StoredShoppingList,
    StoredShoppingListItem,
)
from server.models.split_models import SavedSplit, SplitRequest
from server.models.user_models import User
from server.repositories.pantry_repository import PantryRepository
from server.repositories.shopping_list_repository import ShoppingListRepository
from server.repositories.user_repository import UserRepository
from server.services.audit_log_service import AuditLogService
from server.services.group_service import GroupService
from server.services.item_matching_service import ItemMatchingService

logger = logging.getLogger(__name__)


def find_open_items(stored_list: StoredShoppingList) -> list[StoredShoppingListItem]:
    return [item for item in stored_list.items if not item.is_crossed_off]


def describe_item_names(items: list[StoredShoppingListItem]) -> str:
    return ", ".join(item.name for item in items)


class ShoppingListMatchingService:
    def __init__(
        self,
        user_repository: UserRepository,
        group_service: GroupService,
        shopping_list_repository: ShoppingListRepository,
        pantry_repository: PantryRepository,
        item_matching_service: ItemMatchingService,
        audit_log_service: AuditLogService,
    ):
        self.user_repository = user_repository
        self.group_service = group_service
        self.shopping_list_repository = shopping_list_repository
        self.pantry_repository = pantry_repository
        self.item_matching_service = item_matching_service
        self.audit_log_service = audit_log_service

    def match_group_items(self, group_id: str, match_request: MatchItemsRequest, user: User) -> GroupItemMatches:
        stored_group = self.group_service.get_group_for_member(group_id, user.id)
        stored_list = self.shopping_list_repository.find_by_group_id(group_id)
        if stored_list is None:
            return GroupItemMatches(shopping_list_id=None, shopping_list_name=None, assignments={}, matches={})
        open_items = find_open_items(stored_list)
        matches = self.item_matching_service.match_items(match_request.items, open_items)
        return GroupItemMatches(
            shopping_list_id=stored_list.id,
            shopping_list_name=stored_list.name,
            assignments=self.build_assignments(matches, open_items, stored_group),
            matches=matches,
        )

    def build_assignments(
        self, matches: dict[str, list[str]], open_items: list[StoredShoppingListItem], stored_group: StoredGroup
    ) -> dict[str, list[str]]:
        requester_ids_by_item_id = {item.id: item.requested_by_id for item in open_items}
        member_users = self.user_repository.find_by_ids(stored_group.member_ids)
        usernames_by_id = {member_user.id: member_user.username for member_user in member_users}
        assignments = {}
        for receipt_item_id, shopping_item_ids in matches.items():
            usernames = [
                usernames_by_id[requester_ids_by_item_id[shopping_item_id]]
                for shopping_item_id in shopping_item_ids
                if requester_ids_by_item_id.get(shopping_item_id) in usernames_by_id
            ]
            if usernames:
                assignments[receipt_item_id] = list(dict.fromkeys(usernames))
        return assignments

    def cross_off_for_split(
        self, stored_group: StoredGroup, split_request: SplitRequest, saved_split: SavedSplit, creator: User
    ) -> list[str]:
        stored_list = self.shopping_list_repository.find_by_group_id(stored_group.id)
        if stored_list is None:
            return []
        open_items_by_id = {item.id: item for item in find_open_items(stored_list)}
        receipt_items = [
            MatchableReceiptItem(id=item.id, name=item.name[:120])
            for item in split_request.receipt.items
            if item.name.strip()
        ]
        matches = split_request.shopping_list_matches
        if matches is None:
            matches = self.try_matching(receipt_items, list(open_items_by_id.values()))
        receipt_item_ids = {item.id for item in receipt_items}
        bought_ids = list(
            dict.fromkeys(
                shopping_item_id
                for receipt_item_id, shopping_item_ids in matches.items()
                if receipt_item_id in receipt_item_ids
                for shopping_item_id in shopping_item_ids
                if shopping_item_id in open_items_by_id
            )
        )
        if not bought_ids:
            return []
        self.shopping_list_repository.cross_off_items_for_split(
            stored_list.id, bought_ids, creator.id, saved_split.id, saved_split.store_name
        )
        bought_items = [open_items_by_id[shopping_item_id] for shopping_item_id in bought_ids]
        self.pantry_repository.stock_items(stored_list.id, bought_items)
        self.record_crossed_off(stored_list, bought_items, creator)
        return [item.name for item in bought_items]

    def try_matching(
        self, receipt_items: list[MatchableReceiptItem], open_items: list[StoredShoppingListItem]
    ) -> dict[str, list[str]]:
        try:
            return self.item_matching_service.match_items(receipt_items, open_items)
        except Exception:
            logger.exception("Could not match split items to the group shopping list")
            return {}

    def record_crossed_off(
        self, stored_list: StoredShoppingList, bought_items: list[StoredShoppingListItem], creator: User
    ) -> None:
        self.audit_log_service.record(
            creator.id,
            "lists",
            "crossed_off_from_split",
            f"Your split crossed off {describe_item_names(bought_items)} on the {stored_list.name} list",
            creator.username,
        )
        items_by_requester_id: dict[str, list[StoredShoppingListItem]] = {}
        for item in bought_items:
            items_by_requester_id.setdefault(item.requested_by_id, []).append(item)
        for requester_id, requested_items in items_by_requester_id.items():
            if requester_id == creator.id:
                continue
            self.audit_log_service.record(
                requester_id,
                "lists",
                "bought_your_items",
                f"@{creator.username} bought your {describe_item_names(requested_items)} "
                f"from the {stored_list.name} list",
                creator.username,
                notify=True,
            )
