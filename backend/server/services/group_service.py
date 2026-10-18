from datetime import datetime, timedelta, timezone

from server.errors import BadRequestError, NotFoundError
from server.models.group_models import Group, GroupRequest, ShoppingTrip, StoredGroup, StoredTrip
from server.models.user_models import StoredUser, User
from server.repositories.friendship_repository import FriendshipRepository
from server.repositories.group_repository import GroupRepository
from server.repositories.shopping_list_repository import ShoppingListRepository
from server.repositories.split_repository import SplitRepository
from server.repositories.user_repository import UserRepository
from server.services.audit_log_service import AuditLogService
from server.services.user_mapper import convert_to_public_profile

MAX_GROUP_MEMBERS = 20
TRIP_LENGTH = timedelta(hours=4)
BUDGET_ALERT_LEVELS = (0.8, 1.0)


def find_month_start() -> datetime:
    return datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def is_trip_active(active_trip: StoredTrip | None) -> bool:
    return active_trip is not None and datetime.now(timezone.utc) - active_trip.started_at < TRIP_LENGTH


class GroupService:
    def __init__(
        self,
        user_repository: UserRepository,
        friendship_repository: FriendshipRepository,
        group_repository: GroupRepository,
        shopping_list_repository: ShoppingListRepository,
        split_repository: SplitRepository,
        audit_log_service: AuditLogService,
    ):
        self.user_repository = user_repository
        self.friendship_repository = friendship_repository
        self.group_repository = group_repository
        self.shopping_list_repository = shopping_list_repository
        self.split_repository = split_repository
        self.audit_log_service = audit_log_service

    def get_group_for_member(self, group_id: str, user_id: str) -> StoredGroup:
        stored_group = self.group_repository.find_by_id(group_id)
        if stored_group is None or user_id not in stored_group.member_ids:
            raise NotFoundError("Group", group_id)
        return stored_group

    def get_group_for_owner(self, group_id: str, user_id: str) -> StoredGroup:
        stored_group = self.get_group_for_member(group_id, user_id)
        if stored_group.owner_id != user_id:
            raise BadRequestError("Only the person who made this group can change it")
        return stored_group

    def list_groups(self, user: User) -> list[Group]:
        stored_groups = self.group_repository.list_for_member(user.id)
        return self.build_groups(stored_groups)

    def get_group(self, group_id: str, user: User) -> Group:
        return self.build_groups([self.get_group_for_member(group_id, user.id)])[0]

    def find_member_ids(
        self, owner: User, member_usernames: list[str], current_member_ids: list[str]
    ) -> list[str]:
        member_ids = [owner.id]
        for username in member_usernames:
            if username == owner.username:
                continue
            member = self.user_repository.find_by_username(username)
            if member is None:
                raise BadRequestError(f"No account with username '{username}'")
            is_current_member = member.id in current_member_ids
            if not is_current_member and not self.friendship_repository.are_friends(owner.id, member.id):
                raise BadRequestError(f"Add @{username} as a friend before adding them to a group")
            member_ids.append(member.id)
        if len(member_ids) < 2:
            raise BadRequestError("Add at least one friend to the group")
        if len(member_ids) > MAX_GROUP_MEMBERS:
            raise BadRequestError(f"Groups can have up to {MAX_GROUP_MEMBERS} people")
        return list(dict.fromkeys(member_ids))

    def create_group(self, group_request: GroupRequest, owner: User) -> Group:
        member_ids = self.find_member_ids(owner, group_request.member_usernames, [])
        stored_group = self.group_repository.create(
            group_request.name, owner.id, member_ids, group_request.monthly_budget
        )
        self.audit_log_service.record(
            owner.id, "groups", "created_group", f"You created the group {stored_group.name}", owner.username
        )
        self.notify_members(member_ids, owner, "added_to_group", f"@{owner.username} added you to {stored_group.name}")
        return self.build_groups([stored_group])[0]

    def update_group(self, group_id: str, group_request: GroupRequest, owner: User) -> Group:
        stored_group = self.get_group_for_owner(group_id, owner.id)
        member_ids = self.find_member_ids(owner, group_request.member_usernames, stored_group.member_ids)
        updated_group = (
            self.group_repository.update(group_id, group_request.name, member_ids, group_request.monthly_budget)
            or stored_group
        )
        added_ids = [member_id for member_id in member_ids if member_id not in stored_group.member_ids]
        removed_ids = [member_id for member_id in stored_group.member_ids if member_id not in member_ids]
        self.audit_log_service.record(
            owner.id, "groups", "updated_group", f"You updated the group {updated_group.name}", owner.username
        )
        self.notify_members(added_ids, owner, "added_to_group", f"@{owner.username} added you to {updated_group.name}")
        self.notify_members(
            removed_ids, owner, "removed_from_group", f"@{owner.username} removed you from {updated_group.name}"
        )
        return self.build_groups([updated_group])[0]

    def delete_group(self, group_id: str, owner: User) -> None:
        stored_group = self.get_group_for_owner(group_id, owner.id)
        self.group_repository.delete(group_id)
        self.shopping_list_repository.delete_by_group_id(group_id)
        self.audit_log_service.record(
            owner.id, "groups", "deleted_group", f"You deleted the group {stored_group.name}", owner.username
        )
        self.notify_members(
            stored_group.member_ids, owner, "deleted_group", f"@{owner.username} deleted the group {stored_group.name}"
        )

    def leave_group(self, group_id: str, member: User) -> None:
        stored_group = self.get_group_for_member(group_id, member.id)
        if stored_group.owner_id == member.id:
            raise BadRequestError("You made this group, so delete it instead of leaving")
        self.group_repository.remove_member(group_id, member.id)
        self.audit_log_service.record(
            member.id, "groups", "left_group", f"You left the group {stored_group.name}", member.username
        )
        self.notify_members(
            [stored_group.owner_id], member, "member_left_group", f"@{member.username} left {stored_group.name}"
        )

    def alert_budget_levels(self, stored_group: StoredGroup, split_total: float, actor: User) -> None:
        if not stored_group.monthly_budget:
            return
        spent_cents = self.split_repository.sum_group_spending_since([stored_group.id], find_month_start()).get(
            stored_group.id, 0
        )
        budget_cents = round(stored_group.monthly_budget * 100)
        spent_before_cents = spent_cents - round(split_total * 100)
        crossed_levels = [
            level for level in BUDGET_ALERT_LEVELS if spent_before_cents < budget_cents * level <= spent_cents
        ]
        if not crossed_levels:
            return
        highest_level = max(crossed_levels)
        spent_text = f"${spent_cents / 100:.2f} of the ${budget_cents / 100:.2f}"
        if highest_level >= 1:
            description = f"{stored_group.name} went over its monthly grocery budget: {spent_text} budget spent"
        else:
            description = f"{stored_group.name} has used {highest_level:.0%} of its monthly budget: {spent_text}"
        for member_id in stored_group.member_ids:
            self.audit_log_service.record(
                member_id, "groups", "budget_alert", description, actor.username, notify=True
            )

    def notify_members(self, member_ids: list[str], actor: User, action: str, description: str) -> None:
        for member_id in member_ids:
            if member_id != actor.id:
                self.audit_log_service.record(member_id, "groups", action, description, actor.username, notify=True)

    def build_groups(self, stored_groups: list[StoredGroup]) -> list[Group]:
        member_ids = list({member_id for stored_group in stored_groups for member_id in stored_group.member_ids})
        users_by_id = {stored_user.id: stored_user for stored_user in self.user_repository.find_by_ids(member_ids)}
        group_ids = [stored_group.id for stored_group in stored_groups]
        list_ids_by_group_id = self.shopping_list_repository.list_ids_by_group_ids(group_ids)
        spent_cents_by_group_id = self.split_repository.sum_group_spending_since(group_ids, find_month_start())
        return [
            self.build_group(
                stored_group,
                users_by_id,
                list_ids_by_group_id.get(stored_group.id),
                spent_cents_by_group_id.get(stored_group.id, 0),
            )
            for stored_group in stored_groups
        ]

    def build_group(
        self,
        stored_group: StoredGroup,
        users_by_id: dict[str, StoredUser],
        shopping_list_id: str | None,
        month_spent_cents: int,
    ) -> Group:
        members = [users_by_id[member_id] for member_id in stored_group.member_ids if member_id in users_by_id]
        owner = users_by_id.get(stored_group.owner_id)
        members.sort(key=lambda member: (member.id != stored_group.owner_id, member.display_name.lower()))
        return Group(
            id=stored_group.id,
            name=stored_group.name,
            owner_username=owner.username if owner else "",
            members=[convert_to_public_profile(member) for member in members],
            shopping_list_id=shopping_list_id,
            active_trip=self.build_trip(stored_group.active_trip, users_by_id),
            monthly_budget=stored_group.monthly_budget,
            month_spent=month_spent_cents / 100,
            created_at=stored_group.created_at,
        )

    def build_trip(self, active_trip: StoredTrip | None, users_by_id: dict[str, StoredUser]) -> ShoppingTrip | None:
        if active_trip is None or not is_trip_active(active_trip) or active_trip.shopper_id not in users_by_id:
            return None
        return ShoppingTrip(
            shopper_username=users_by_id[active_trip.shopper_id].username,
            store=active_trip.store,
            started_at=active_trip.started_at,
        )
