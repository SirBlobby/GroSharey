from server.errors import NotFoundError
from server.models.shopping_list_models import ShoppingList
from server.models.user_models import User
from server.repositories.pantry_repository import PantryRepository, build_name_key
from server.repositories.shopping_list_repository import ShoppingListRepository
from server.services.audit_log_service import AuditLogService
from server.services.shopping_list_service import ShoppingListService


class PantryService:
    def __init__(
        self,
        shopping_list_service: ShoppingListService,
        shopping_list_repository: ShoppingListRepository,
        pantry_repository: PantryRepository,
        audit_log_service: AuditLogService,
    ):
        self.shopping_list_service = shopping_list_service
        self.shopping_list_repository = shopping_list_repository
        self.pantry_repository = pantry_repository
        self.audit_log_service = audit_log_service

    def mark_running_low(self, list_id: str, pantry_item_id: str, user: User) -> ShoppingList:
        stored_list, stored_group = self.shopping_list_service.find_accessible(list_id, user.id)
        pantry_item = next((item for item in stored_list.pantry if item.id == pantry_item_id), None)
        if pantry_item is None or not self.pantry_repository.set_running_low(list_id, pantry_item_id):
            raise NotFoundError("Pantry item", pantry_item_id)

        is_already_on_list = any(
            not item.is_crossed_off and build_name_key(item.name) == pantry_item.name_key for item in stored_list.items
        )
        if not is_already_on_list:
            member_ids = stored_group.member_ids if stored_group else [stored_list.owner_id]
            requester_id = pantry_item.requested_by_id if pantry_item.requested_by_id in member_ids else user.id
            self.shopping_list_repository.add_item(
                list_id, pantry_item.name, pantry_item.quantity, pantry_item.store, pantry_item.notes, requester_id
            )
        if stored_group:
            for member_id in stored_group.member_ids:
                if member_id != user.id:
                    self.audit_log_service.record(
                        member_id,
                        "lists",
                        "pantry_running_low",
                        f"@{user.username} says {pantry_item.name} is running low, so it's back on {stored_list.name}",
                        user.username,
                        notify=True,
                    )
        return self.shopping_list_service.get_shopping_list(list_id, user)

    def use_up(self, list_id: str, pantry_item_id: str, user: User) -> ShoppingList:
        self.shopping_list_service.find_accessible(list_id, user.id)
        if not self.pantry_repository.remove(list_id, pantry_item_id):
            raise NotFoundError("Pantry item", pantry_item_id)
        return self.shopping_list_service.get_shopping_list(list_id, user)
