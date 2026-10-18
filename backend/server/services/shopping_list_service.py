from server.errors import BadRequestError, NotFoundError
from server.models.group_models import StoredGroup
from server.models.shopping_list_models import (
    AddShoppingListItemRequest,
    CreateShoppingListRequest,
    ShoppingList,
    ShoppingListItem,
    StoredShoppingList,
    StoredShoppingListItem,
)
from server.models.user_models import StoredUser, User
from server.repositories.group_repository import GroupRepository
from server.repositories.shopping_list_repository import ShoppingListRepository
from server.repositories.user_repository import UserRepository
from server.services.audit_log_service import AuditLogService
from server.services.user_mapper import convert_to_public_profile

UNKNOWN_USERNAME = "unknown"


def collect_user_ids(stored_list: StoredShoppingList, stored_group: StoredGroup | None) -> set[str]:
    user_ids = {stored_list.owner_id}
    for item in stored_list.items:
        user_ids.add(item.requested_by_id)
        if item.crossed_off_by_id:
            user_ids.add(item.crossed_off_by_id)
    if stored_group:
        user_ids.update(stored_group.member_ids)
    return user_ids


class ShoppingListService:
    def __init__(
        self,
        user_repository: UserRepository,
        group_repository: GroupRepository,
        shopping_list_repository: ShoppingListRepository,
        audit_log_service: AuditLogService,
    ):
        self.user_repository = user_repository
        self.group_repository = group_repository
        self.shopping_list_repository = shopping_list_repository
        self.audit_log_service = audit_log_service

    def find_accessible(self, list_id: str, user_id: str) -> tuple[StoredShoppingList, StoredGroup | None]:
        stored_list = self.shopping_list_repository.find_by_id(list_id)
        if stored_list is None:
            raise NotFoundError("Shopping list", list_id)
        if stored_list.group_id is None:
            if stored_list.owner_id != user_id:
                raise NotFoundError("Shopping list", list_id)
            return stored_list, None
        stored_group = self.group_repository.find_by_id(stored_list.group_id)
        if stored_group is None or user_id not in stored_group.member_ids:
            raise NotFoundError("Shopping list", list_id)
        return stored_list, stored_group

    def list_shopping_lists(self, user: User) -> list[ShoppingList]:
        stored_groups = self.group_repository.list_for_member(user.id)
        groups_by_id = {stored_group.id: stored_group for stored_group in stored_groups}
        stored_lists = self.shopping_list_repository.list_accessible(user.id, list(groups_by_id))
        return [
            self.build_shopping_list(stored_list, groups_by_id.get(stored_list.group_id or ""))
            for stored_list in stored_lists
        ]

    def get_shopping_list(self, list_id: str, user: User) -> ShoppingList:
        return self.build_shopping_list(*self.find_accessible(list_id, user.id))

    def create_shopping_list(self, list_request: CreateShoppingListRequest, user: User) -> ShoppingList:
        stored_group = None
        if list_request.group_id:
            stored_group = self.group_repository.find_by_id(list_request.group_id)
            if stored_group is None or user.id not in stored_group.member_ids:
                raise NotFoundError("Group", list_request.group_id)
        stored_list = self.shopping_list_repository.create(
            list_request.name, user.id, stored_group.id if stored_group else None
        )
        self.audit_log_service.record(
            user.id, "lists", "created_list", f"You created the shopping list {stored_list.name}", user.username
        )
        if stored_group:
            for member_id in stored_group.member_ids:
                if member_id != user.id:
                    self.audit_log_service.record(
                        member_id,
                        "lists",
                        "created_group_list",
                        f"@{user.username} started the {stored_list.name} list for {stored_group.name}",
                        user.username,
                        notify=True,
                    )
        return self.build_shopping_list(stored_list, stored_group)

    def delete_shopping_list(self, list_id: str, user: User) -> None:
        stored_list, stored_group = self.find_accessible(list_id, user.id)
        is_group_owner = stored_group is not None and stored_group.owner_id == user.id
        if stored_list.owner_id != user.id and not is_group_owner:
            raise BadRequestError("Only the person who made this list can delete it")
        self.shopping_list_repository.delete(list_id)
        self.audit_log_service.record(
            user.id, "lists", "deleted_list", f"You deleted the shopping list {stored_list.name}", user.username
        )

    def find_requester_id(
        self, requested_by: str | None, user: User, stored_group: StoredGroup | None
    ) -> str:
        if requested_by is None or requested_by.lower() == user.username:
            return user.id
        if stored_group is None:
            raise BadRequestError("Only group lists can have items for other people")
        requester = self.user_repository.find_by_username(requested_by.lower())
        if requester is None or requester.id not in stored_group.member_ids:
            raise BadRequestError(f"@{requested_by} isn't in {stored_group.name}")
        return requester.id

    def add_item(self, list_id: str, item_request: AddShoppingListItemRequest, user: User) -> ShoppingList:
        stored_list, stored_group = self.find_accessible(list_id, user.id)
        requester_id = self.find_requester_id(item_request.requested_by, user, stored_group)
        self.shopping_list_repository.add_item(
            list_id, item_request.name, item_request.quantity, item_request.store, item_request.notes, requester_id
        )
        return self.get_shopping_list(list_id, user)

    def set_item_crossed_off(self, list_id: str, item_id: str, is_crossed_off: bool, user: User) -> ShoppingList:
        self.find_accessible(list_id, user.id)
        if not self.shopping_list_repository.set_item_crossed_off(list_id, item_id, is_crossed_off, user.id):
            raise NotFoundError("Shopping list item", item_id)
        return self.get_shopping_list(list_id, user)

    def remove_item(self, list_id: str, item_id: str, user: User) -> ShoppingList:
        self.find_accessible(list_id, user.id)
        if not self.shopping_list_repository.remove_item(list_id, item_id):
            raise NotFoundError("Shopping list item", item_id)
        return self.get_shopping_list(list_id, user)

    def build_shopping_list(self, stored_list: StoredShoppingList, stored_group: StoredGroup | None) -> ShoppingList:
        user_ids = list(collect_user_ids(stored_list, stored_group))
        users_by_id = {stored_user.id: stored_user for stored_user in self.user_repository.find_by_ids(user_ids)}
        member_ids = stored_group.member_ids if stored_group else [stored_list.owner_id]
        members = [
            convert_to_public_profile(users_by_id[member_id]) for member_id in member_ids if member_id in users_by_id
        ]
        return ShoppingList(
            id=stored_list.id,
            name=stored_list.name,
            owner_username=self.find_username(users_by_id, stored_list.owner_id),
            group_id=stored_group.id if stored_group else None,
            group_name=stored_group.name if stored_group else None,
            members=members,
            items=[self.build_item(item, users_by_id) for item in stored_list.items],
            created_at=stored_list.created_at,
        )

    def build_item(self, item: StoredShoppingListItem, users_by_id: dict[str, StoredUser]) -> ShoppingListItem:
        return ShoppingListItem(
            id=item.id,
            name=item.name,
            quantity=item.quantity,
            store=item.store,
            notes=item.notes,
            requested_by=self.find_username(users_by_id, item.requested_by_id),
            is_crossed_off=item.is_crossed_off,
            crossed_off_by=self.find_username(users_by_id, item.crossed_off_by_id) if item.crossed_off_by_id else None,
            crossed_off_at=item.crossed_off_at,
            bought_at=item.bought_at,
            created_at=item.created_at,
        )

    def find_username(self, users_by_id: dict[str, StoredUser], user_id: str) -> str:
        stored_user = users_by_id.get(user_id)
        return stored_user.username if stored_user else UNKNOWN_USERNAME
