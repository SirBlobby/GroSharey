from datetime import datetime, timezone

from bson import ObjectId
from pymongo import DESCENDING
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from server.errors import ConflictError
from server.models.shopping_list_models import StoredShoppingList, StoredShoppingListItem


def convert_document_to_shopping_list(list_document: dict) -> StoredShoppingList:
    return StoredShoppingList(
        id=str(list_document["_id"]),
        name=list_document["name"],
        owner_id=list_document["owner_id"],
        group_id=list_document.get("group_id"),
        items=[StoredShoppingListItem(**item_document) for item_document in list_document.get("items", [])],
        created_at=list_document["created_at"],
    )


class ShoppingListRepository:
    def __init__(self, database: Database):
        self.lists_collection = database["shopping_lists"]
        self.lists_collection.create_index("owner_id")
        self.lists_collection.create_index(
            "group_id", unique=True, partialFilterExpression={"group_id": {"$type": "string"}}
        )

    def create(self, name: str, owner_id: str, group_id: str | None) -> StoredShoppingList:
        list_document = {
            "name": name,
            "owner_id": owner_id,
            "group_id": group_id,
            "items": [],
            "created_at": datetime.now(timezone.utc),
        }
        try:
            insert_result = self.lists_collection.insert_one(list_document)
        except DuplicateKeyError:
            raise ConflictError("That group already has a shopping list")
        list_document["_id"] = insert_result.inserted_id
        return convert_document_to_shopping_list(list_document)

    def find_by_id(self, list_id: str) -> StoredShoppingList | None:
        if not ObjectId.is_valid(list_id):
            return None
        list_document = self.lists_collection.find_one({"_id": ObjectId(list_id)})
        return convert_document_to_shopping_list(list_document) if list_document else None

    def find_by_group_id(self, group_id: str) -> StoredShoppingList | None:
        list_document = self.lists_collection.find_one({"group_id": group_id})
        return convert_document_to_shopping_list(list_document) if list_document else None

    def list_ids_by_group_ids(self, group_ids: list[str]) -> dict[str, str]:
        list_documents = self.lists_collection.find({"group_id": {"$in": group_ids}}, {"group_id": 1})
        return {list_document["group_id"]: str(list_document["_id"]) for list_document in list_documents}

    def list_accessible(self, user_id: str, group_ids: list[str]) -> list[StoredShoppingList]:
        list_documents = self.lists_collection.find(
            {"$or": [{"owner_id": user_id, "group_id": None}, {"group_id": {"$in": group_ids}}]}
        ).sort("created_at", DESCENDING)
        return [convert_document_to_shopping_list(list_document) for list_document in list_documents]

    def delete(self, list_id: str) -> None:
        self.lists_collection.delete_one({"_id": ObjectId(list_id)})

    def delete_by_group_id(self, group_id: str) -> None:
        self.lists_collection.delete_one({"group_id": group_id})

    def add_item(
        self,
        list_id: str,
        name: str,
        quantity: str | None,
        store: str | None,
        notes: str | None,
        requested_by_id: str,
    ) -> None:
        item_document = StoredShoppingListItem(
            id=str(ObjectId()),
            name=name,
            quantity=quantity,
            store=store,
            notes=notes,
            requested_by_id=requested_by_id,
            created_at=datetime.now(timezone.utc),
        ).model_dump()
        self.lists_collection.update_one({"_id": ObjectId(list_id)}, {"$push": {"items": item_document}})

    def set_item_crossed_off(self, list_id: str, item_id: str, is_crossed_off: bool, user_id: str) -> bool:
        update_result = self.lists_collection.update_one(
            {"_id": ObjectId(list_id), "items.id": item_id},
            {
                "$set": {
                    "items.$.is_crossed_off": is_crossed_off,
                    "items.$.crossed_off_by_id": user_id if is_crossed_off else None,
                    "items.$.crossed_off_at": datetime.now(timezone.utc) if is_crossed_off else None,
                    "items.$.crossed_off_split_id": None,
                    "items.$.bought_at": None,
                }
            },
        )
        return update_result.matched_count > 0

    def cross_off_items_for_split(
        self, list_id: str, item_ids: list[str], user_id: str, split_id: str, bought_at: str | None
    ) -> None:
        self.lists_collection.update_one(
            {"_id": ObjectId(list_id)},
            {
                "$set": {
                    "items.$[bought].is_crossed_off": True,
                    "items.$[bought].crossed_off_by_id": user_id,
                    "items.$[bought].crossed_off_at": datetime.now(timezone.utc),
                    "items.$[bought].crossed_off_split_id": split_id,
                    "items.$[bought].bought_at": bought_at,
                }
            },
            array_filters=[{"bought.id": {"$in": item_ids}, "bought.is_crossed_off": False}],
        )

    def remove_item(self, list_id: str, item_id: str) -> bool:
        update_result = self.lists_collection.update_one(
            {"_id": ObjectId(list_id), "items.id": item_id}, {"$pull": {"items": {"id": item_id}}}
        )
        return update_result.matched_count > 0
