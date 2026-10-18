from server.models.friend_models import Friend
from server.models.group_models import Group, GroupRequest, StartTripRequest
from server.services.assistant.assistant_context import AssistantContext
from server.services.assistant.list_tools import declare
from server.services.assistant.name_matching import (
    list_names_match,
    needs_confirmation,
    person_matches,
    pick_one,
    remove_filler_words,
)

GROUP_NAME = {"type": "string", "description": "Group name. Leave empty when the speaker has only one group."}
PEOPLE = {"type": "array", "items": {"type": "string"}, "description": "Names or usernames of friends"}

GROUP_TOOL_DECLARATIONS = [
    declare(
        "list_groups",
        "Lists the speaker's groups with members, who made them, monthly budget, money spent this month, "
        "and any shopping trip in progress.",
        {},
    ),
    declare(
        "create_group",
        "Makes a new group with some of the speaker's friends.",
        {"name": {"type": "string"}, "member_names": PEOPLE, "monthly_budget": {"type": "number"}},
        ["name", "member_names"],
    ),
    declare(
        "add_group_members",
        "Adds friends to a group the speaker made.",
        {"group_name": GROUP_NAME, "member_names": PEOPLE},
        ["member_names"],
    ),
    declare(
        "remove_group_members",
        "Removes people from a group the speaker made. Needs the speaker's confirmation first.",
        {"group_name": GROUP_NAME, "member_names": PEOPLE, "confirmed": {"type": "boolean"}},
        ["member_names"],
    ),
    declare(
        "set_group_budget",
        "Sets a group's monthly grocery budget in dollars. Use 0 to remove the budget.",
        {"group_name": GROUP_NAME, "monthly_budget": {"type": "number"}},
        ["monthly_budget"],
    ),
    declare(
        "start_shopping_trip",
        "Tells the group the speaker is going shopping at a store, so they can add last-minute items.",
        {"group_name": GROUP_NAME, "store": {"type": "string"}},
        ["store"],
    ),
    declare("end_shopping_trip", "Ends the group's shopping trip.", {"group_name": GROUP_NAME}),
]


class GroupTools:
    def __init__(self, context: AssistantContext):
        self.context = context
        self.user = context.user
        self.group_service = context.services.group_service
        self.group_trip_service = context.services.group_trip_service

    def find_group(self, group_name: str = "") -> Group:
        groups = self.group_service.list_groups(self.user)
        all_names = [group.name for group in groups]
        if len(groups) == 1 and not remove_filler_words(group_name):
            return groups[0]
        matches = [group for group in groups if list_names_match(group_name, group.name)]
        return pick_one(matches, group_name or "(no name)", "group", all_names)

    def find_friends(self, member_names: list[str]) -> list[Friend]:
        friends = self.context.services.friend_service.list_friends(self.user.id)
        friend_names = [friend.display_name for friend in friends]
        return [
            pick_one(
                [friend for friend in friends if person_matches(name, friend.username, friend.display_name)],
                name,
                "friend",
                friend_names,
            )
            for name in member_names
        ]

    def save_group(self, group: Group, member_usernames: list[str], monthly_budget: float | None) -> Group:
        group_request = GroupRequest(name=group.name, member_usernames=member_usernames, monthly_budget=monthly_budget)
        updated_group = self.group_service.update_group(group.id, group_request, self.user)
        self.context.changed_data = True
        return updated_group

    def describe_group(self, group: Group) -> dict:
        trip = group.active_trip
        return {
            "name": group.name,
            "made_by": "the speaker" if group.owner_username == self.user.username else group.owner_username,
            "members": [member.display_name for member in group.members],
            "monthly_budget": group.monthly_budget,
            "spent_this_month": group.month_spent,
            "shopping_trip": f"{trip.shopper_username} is shopping at {trip.store}" if trip else None,
            "has_shopping_list": group.shopping_list_id is not None,
        }

    def list_groups(self) -> dict:
        return {"groups": [self.describe_group(group) for group in self.group_service.list_groups(self.user)]}

    def create_group(self, name: str, member_names: list[str], monthly_budget: float = 0) -> dict:
        members = self.find_friends(member_names)
        group_request = GroupRequest(
            name=name,
            member_usernames=[member.username for member in members],
            monthly_budget=monthly_budget or None,
        )
        created_group = self.group_service.create_group(group_request, self.user)
        self.context.changed_data = True
        return {"created": self.describe_group(created_group)}

    def add_group_members(self, member_names: list[str], group_name: str = "") -> dict:
        group = self.find_group(group_name)
        new_members = self.find_friends(member_names)
        member_usernames = [member.username for member in group.members] + [member.username for member in new_members]
        updated_group = self.save_group(group, list(dict.fromkeys(member_usernames)), group.monthly_budget)
        return {"group": updated_group.name, "members": [member.display_name for member in updated_group.members]}

    def remove_group_members(self, member_names: list[str], group_name: str = "", confirmed: bool = False) -> dict:
        group = self.find_group(group_name)
        member_display_names = [member.display_name for member in group.members]
        leaving_members = [
            pick_one(
                [member for member in group.members if person_matches(name, member.username, member.display_name)],
                name,
                f"member of {group.name}",
                member_display_names,
            )
            for name in member_names
        ]
        leaving_names = ", ".join(member.display_name for member in leaving_members)
        if not confirmed:
            return needs_confirmation(f"remove {leaving_names} from {group.name}")
        leaving_usernames = {member.username for member in leaving_members}
        remaining_usernames = [member.username for member in group.members if member.username not in leaving_usernames]
        updated_group = self.save_group(group, remaining_usernames, group.monthly_budget)
        return {"group": updated_group.name, "removed": leaving_names}

    def set_group_budget(self, monthly_budget: float, group_name: str = "") -> dict:
        group = self.find_group(group_name)
        member_usernames = [member.username for member in group.members]
        updated_group = self.save_group(group, member_usernames, monthly_budget or None)
        return {"group": updated_group.name, "monthly_budget": updated_group.monthly_budget}

    def start_shopping_trip(self, store: str, group_name: str = "") -> dict:
        group = self.find_group(group_name)
        updated_group = self.group_trip_service.start_trip(group.id, StartTripRequest(store=store), self.user)
        self.context.changed_data = True
        return {"group": updated_group.name, "trip_started_at": store, "group_was_notified": True}

    def end_shopping_trip(self, group_name: str = "") -> dict:
        group = self.find_group(group_name)
        self.group_trip_service.end_trip(group.id, self.user)
        self.context.changed_data = True
        return {"group": group.name, "trip_ended": True}
