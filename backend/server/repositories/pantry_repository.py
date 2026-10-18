from datetime import datetime, timezone

from bson import ObjectId
from pymongo.database import Database

from server.models.shopping_list_models import StoredPantryItem, StoredShoppingListItem


def build_name_key(name: str) -> str:
    return " ".join(name.lower().split())


class PantryRepository:
    def __init__(self, database: Database):
        self.lists_collection = database["shopping_lists"]

    def stock_items(self, list_id: str, bought_items: list[StoredShoppingListItem]) -> None:
        if not bought_items:
            return
        stocked_at = datetime.now(timezone.utc)
        pantry_documents_by_name_key = {}
        for item in bought_items:
            name_key = build_name_key(item.name)
            pantry_documents_by_name_key[name_key] = StoredPantryItem(
                id=str(ObjectId()),
                name=item.name,
                name_key=name_key,
                quantity=item.quantity,
                store=item.store,
                notes=item.notes,
                requested_by_id=item.requested_by_id,
                source_item_id=item.id,
                stocked_at=stocked_at,
            ).model_dump()
        name_keys = list(pantry_documents_by_name_key)
        pantry_documents = list(pantry_documents_by_name_key.values())
        self.lists_collection.update_one(
            {"_id": ObjectId(list_id)}, {"$pull": {"pantry": {"name_key": {"$in": name_keys}}}}
        )
        self.lists_collection.update_one(
            {"_id": ObjectId(list_id)}, {"$push": {"pantry": {"$each": pantry_documents}}}
        )

    def remove_stocked_from(self, list_id: str, source_item_id: str) -> None:
        self.lists_collection.update_one(
            {"_id": ObjectId(list_id)}, {"$pull": {"pantry": {"source_item_id": source_item_id}}}
        )

    def set_running_low(self, list_id: str, pantry_item_id: str) -> bool:
        update_result = self.lists_collection.update_one(
            {"_id": ObjectId(list_id), "pantry.id": pantry_item_id}, {"$set": {"pantry.$.is_running_low": True}}
        )
        return update_result.matched_count > 0

    def remove(self, list_id: str, pantry_item_id: str) -> bool:
        update_result = self.lists_collection.update_one(
            {"_id": ObjectId(list_id), "pantry.id": pantry_item_id}, {"$pull": {"pantry": {"id": pantry_item_id}}}
        )
        return update_result.matched_count > 0
