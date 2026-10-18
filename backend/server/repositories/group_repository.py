from datetime import datetime, timezone

from bson import ObjectId
from pymongo import DESCENDING
from pymongo.database import Database

from server.models.group_models import StoredGroup, StoredTrip


def convert_document_to_group(group_document: dict) -> StoredGroup:
    return StoredGroup(
        id=str(group_document["_id"]),
        name=group_document["name"],
        owner_id=group_document["owner_id"],
        member_ids=group_document["member_ids"],
        active_trip=group_document.get("active_trip"),
        monthly_budget=group_document.get("monthly_budget"),
        created_at=group_document["created_at"],
    )


class GroupRepository:
    def __init__(self, database: Database):
        self.groups_collection = database["groups"]
        self.groups_collection.create_index([("member_ids", 1), ("created_at", DESCENDING)])

    def create(
        self, name: str, owner_id: str, member_ids: list[str], monthly_budget: float | None
    ) -> StoredGroup:
        group_document = {
            "name": name,
            "owner_id": owner_id,
            "member_ids": member_ids,
            "monthly_budget": monthly_budget,
            "created_at": datetime.now(timezone.utc),
        }
        insert_result = self.groups_collection.insert_one(group_document)
        group_document["_id"] = insert_result.inserted_id
        return convert_document_to_group(group_document)

    def find_by_id(self, group_id: str) -> StoredGroup | None:
        if not ObjectId.is_valid(group_id):
            return None
        group_document = self.groups_collection.find_one({"_id": ObjectId(group_id)})
        return convert_document_to_group(group_document) if group_document else None

    def list_for_member(self, user_id: str) -> list[StoredGroup]:
        group_documents = self.groups_collection.find({"member_ids": user_id}).sort("created_at", DESCENDING)
        return [convert_document_to_group(group_document) for group_document in group_documents]

    def update(
        self, group_id: str, name: str, member_ids: list[str], monthly_budget: float | None
    ) -> StoredGroup | None:
        self.groups_collection.update_one(
            {"_id": ObjectId(group_id)},
            {"$set": {"name": name, "member_ids": member_ids, "monthly_budget": monthly_budget}},
        )
        return self.find_by_id(group_id)

    def remove_member(self, group_id: str, user_id: str) -> None:
        self.groups_collection.update_one({"_id": ObjectId(group_id)}, {"$pull": {"member_ids": user_id}})

    def set_active_trip(self, group_id: str, active_trip: StoredTrip | None) -> None:
        trip_document = active_trip.model_dump() if active_trip else None
        self.groups_collection.update_one({"_id": ObjectId(group_id)}, {"$set": {"active_trip": trip_document}})

    def delete(self, group_id: str) -> None:
        self.groups_collection.delete_one({"_id": ObjectId(group_id)})
