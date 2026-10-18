from server.errors import BadRequestError
from server.models.shopping_list_models import (
    AddShoppingListItemRequest,
    CreateShoppingListRequest,
    PantryItem,
    ShoppingList,
    ShoppingListItem,
)
from server.services.assistant.assistant_context import AssistantContext
from server.services.assistant.name_matching import (
    is_speaker,
    list_names_match,
    names_match,
    needs_confirmation,
    person_matches,
    pick_one,
    remove_filler_words,
)

LIST_NAME = {"type": "string", "description": "List or group name. Leave empty when there is only one list."}
ITEM_NAMES = {"type": "array", "items": {"type": "string"}, "description": "Item names as the speaker said them"}
NEW_ITEM = {
    "type": "object",
    "properties": {
        "name": {"type": "string", "description": "The item, like 'milk' or 'paper towels'"},
        "quantity": {"type": "string", "description": "How much, like '2' or '1 gallon'. Empty if not said."},
        "store": {"type": "string", "description": "Store to buy it from, only if the speaker said one"},
        "notes": {"type": "string", "description": "Details like a brand or 'the organic kind'"},
        "for_person": {"type": "string", "description": "Who it's for. Empty when it's for the speaker."},
    },
    "required": ["name"],
}


def declare(name: str, description: str, properties: dict, required: list[str] | None = None) -> dict:
    return {
        "name": name,
        "description": description,
        "parameters_json_schema": {"type": "object", "properties": properties, "required": required or []},
    }


LIST_TOOL_DECLARATIONS = [
    declare(
        "list_shopping_lists",
        "Lists the speaker's shopping lists with their group, members, items left, and pantry size.",
        {},
    ),
    declare(
        "get_list_items",
        "Gets the items left to buy on a list and who asked for each. Can include crossed-off items.",
        {"list_name": LIST_NAME, "include_crossed_off": {"type": "boolean"}},
    ),
    declare(
        "add_list_items",
        "Adds items to a shopping list.",
        {"list_name": LIST_NAME, "items": {"type": "array", "items": NEW_ITEM}},
        ["items"],
    ),
    declare(
        "cross_off_list_items",
        "Crosses items off a list because they were bought. They move to the pantry.",
        {"list_name": LIST_NAME, "item_names": ITEM_NAMES},
        ["item_names"],
    ),
    declare(
        "put_back_list_items",
        "Puts crossed-off items back on the list as not bought.",
        {"list_name": LIST_NAME, "item_names": ITEM_NAMES},
        ["item_names"],
    ),
    declare(
        "remove_list_items",
        "Deletes items from a list completely, for mistakes or things nobody needs anymore.",
        {"list_name": LIST_NAME, "item_names": ITEM_NAMES},
        ["item_names"],
    ),
    declare(
        "create_shopping_list",
        "Makes a new shopping list, either personal or for one of the speaker's groups.",
        {"name": {"type": "string"}, "group_name": {"type": "string", "description": "Empty for a personal list"}},
        ["name"],
    ),
    declare(
        "delete_shopping_list",
        "Deletes a whole shopping list. Needs the speaker's confirmation first.",
        {"list_name": LIST_NAME, "confirmed": {"type": "boolean"}},
        ["list_name"],
    ),
    declare("get_pantry", "Gets what is in a list's pantry and what is running low.", {"list_name": LIST_NAME}),
    declare(
        "mark_pantry_running_low",
        "Marks pantry items as running low, which puts them back on the shopping list.",
        {"list_name": LIST_NAME, "item_names": ITEM_NAMES},
        ["item_names"],
    ),
    declare(
        "use_up_pantry_items",
        "Removes pantry items that are all used up.",
        {"list_name": LIST_NAME, "item_names": ITEM_NAMES},
        ["item_names"],
    ),
]


class ListTools:
    def __init__(self, context: AssistantContext):
        self.context = context
        self.user = context.user
        self.shopping_list_service = context.services.shopping_list_service
        self.pantry_service = context.services.pantry_service

    def find_list(self, list_name: str = "") -> ShoppingList:
        shopping_lists = self.shopping_list_service.list_shopping_lists(self.user)
        if not shopping_lists:
            raise BadRequestError("The speaker has no shopping lists yet. Offer to make one.")
        all_names = [shopping_list.name for shopping_list in shopping_lists]
        if not remove_filler_words(list_name):
            if len(shopping_lists) == 1:
                return shopping_lists[0]
            raise BadRequestError(f"Ask which list. Lists: {', '.join(all_names)}")
        matches = [
            shopping_list
            for shopping_list in shopping_lists
            if list_names_match(list_name, shopping_list.name)
            or list_names_match(list_name, shopping_list.group_name)
        ]
        return pick_one(matches, list_name or "(no name)", "list", all_names)

    def find_requester(self, shopping_list: ShoppingList, person: str | None) -> str | None:
        if is_speaker(person):
            return None
        matches = [
            member.username
            for member in shopping_list.members
            if person_matches(person, member.username, member.display_name)
        ]
        member_names = [member.display_name for member in shopping_list.members]
        return pick_one(matches, person or "", f"person on {shopping_list.name}", member_names)

    def find_items(
        self, items: list[ShoppingListItem] | list[PantryItem], item_names: list[str]
    ) -> tuple[list, list[str]]:
        remaining_items = list(items)
        found_items = []
        missing_names = []
        for item_name in item_names:
            matching_item = next((item for item in remaining_items if names_match(item_name, item.name)), None)
            if matching_item is None:
                missing_names.append(item_name)
            else:
                remaining_items.remove(matching_item)
                found_items.append(matching_item)
        return found_items, missing_names

    def describe_person(self, username: str) -> str:
        return "the speaker" if username == self.user.username else username

    def list_shopping_lists(self) -> dict:
        return {
            "lists": [
                {
                    "name": shopping_list.name,
                    "group": shopping_list.group_name,
                    "members": [member.display_name for member in shopping_list.members],
                    "items_left": sum(1 for item in shopping_list.items if not item.is_crossed_off),
                    "pantry_items": len(shopping_list.pantry),
                }
                for shopping_list in self.shopping_list_service.list_shopping_lists(self.user)
            ]
        }

    def get_list_items(self, list_name: str = "", include_crossed_off: bool = False) -> dict:
        shopping_list = self.find_list(list_name)
        return {
            "list": shopping_list.name,
            "items": [
                {
                    "name": item.name,
                    "quantity": item.quantity,
                    "store": item.store,
                    "notes": item.notes,
                    "for": self.describe_person(item.requested_by),
                    "crossed_off": item.is_crossed_off,
                }
                for item in shopping_list.items
                if include_crossed_off or not item.is_crossed_off
            ],
        }

    def add_list_items(self, items: list[dict], list_name: str = "") -> dict:
        shopping_list = self.find_list(list_name)
        added_items = []
        for item in items:
            item_request = AddShoppingListItemRequest(
                name=item.get("name", ""),
                quantity=item.get("quantity") or None,
                store=item.get("store") or None,
                notes=item.get("notes") or None,
                requested_by=self.find_requester(shopping_list, item.get("for_person")),
            )
            self.shopping_list_service.add_item(shopping_list.id, item_request, self.user)
            added_items.append({"name": item_request.name, "for": item_request.requested_by or "the speaker"})
        self.context.changed_data = True
        return {"list": shopping_list.name, "added": added_items}

    def change_crossed_off(self, list_name: str, item_names: list[str], is_crossed_off: bool) -> dict:
        shopping_list = self.find_list(list_name)
        candidates = [item for item in shopping_list.items if item.is_crossed_off != is_crossed_off]
        found_items, missing_names = self.find_items(candidates, item_names)
        for item in found_items:
            self.shopping_list_service.set_item_crossed_off(shopping_list.id, item.id, is_crossed_off, self.user)
        self.context.changed_data = self.context.changed_data or bool(found_items)
        result_key = "crossed_off" if is_crossed_off else "put_back"
        found_names = [item.name for item in found_items]
        return {"list": shopping_list.name, result_key: found_names, "not_found": missing_names}

    def cross_off_list_items(self, item_names: list[str], list_name: str = "") -> dict:
        return self.change_crossed_off(list_name, item_names, True)

    def put_back_list_items(self, item_names: list[str], list_name: str = "") -> dict:
        return self.change_crossed_off(list_name, item_names, False)

    def remove_list_items(self, item_names: list[str], list_name: str = "") -> dict:
        shopping_list = self.find_list(list_name)
        found_items, missing_names = self.find_items(shopping_list.items, item_names)
        for item in found_items:
            self.shopping_list_service.remove_item(shopping_list.id, item.id, self.user)
        self.context.changed_data = self.context.changed_data or bool(found_items)
        found_names = [item.name for item in found_items]
        return {"list": shopping_list.name, "removed": found_names, "not_found": missing_names}

    def create_shopping_list(self, name: str, group_name: str = "") -> dict:
        group_id = None
        if group_name.strip():
            groups = self.context.services.group_service.list_groups(self.user)
            matches = [group for group in groups if list_names_match(group_name, group.name)]
            group_id = pick_one(matches, group_name, "group", [group.name for group in groups]).id
        created_list = self.shopping_list_service.create_shopping_list(
            CreateShoppingListRequest(name=name, group_id=group_id), self.user
        )
        self.context.changed_data = True
        return {"created": created_list.name, "group": created_list.group_name}

    def delete_shopping_list(self, list_name: str, confirmed: bool = False) -> dict:
        shopping_list = self.find_list(list_name)
        if not confirmed:
            return needs_confirmation(f"delete the whole {shopping_list.name} list")
        self.shopping_list_service.delete_shopping_list(shopping_list.id, self.user)
        self.context.changed_data = True
        return {"deleted": shopping_list.name}

    def get_pantry(self, list_name: str = "") -> dict:
        shopping_list = self.find_list(list_name)
        return {
            "list": shopping_list.name,
            "pantry": [
                {
                    "name": item.name,
                    "running_low": item.is_running_low,
                    "for": self.describe_person(item.requested_by),
                }
                for item in shopping_list.pantry
            ],
        }

    def mark_pantry_running_low(self, item_names: list[str], list_name: str = "") -> dict:
        shopping_list = self.find_list(list_name)
        candidates = [item for item in shopping_list.pantry if not item.is_running_low]
        found_items, missing_names = self.find_items(candidates, item_names)
        for item in found_items:
            self.pantry_service.mark_running_low(shopping_list.id, item.id, self.user)
        self.context.changed_data = self.context.changed_data or bool(found_items)
        return {
            "list": shopping_list.name,
            "marked_running_low_and_added_back": [item.name for item in found_items],
            "not_in_pantry": missing_names,
        }

    def use_up_pantry_items(self, item_names: list[str], list_name: str = "") -> dict:
        shopping_list = self.find_list(list_name)
        found_items, missing_names = self.find_items(shopping_list.pantry, item_names)
        for item in found_items:
            self.pantry_service.use_up(shopping_list.id, item.id, self.user)
        self.context.changed_data = self.context.changed_data or bool(found_items)
        found_names = [item.name for item in found_items]
        return {"list": shopping_list.name, "used_up": found_names, "not_in_pantry": missing_names}
