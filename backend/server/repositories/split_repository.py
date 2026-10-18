from datetime import datetime, timezone

from bson import ObjectId
from pymongo import DESCENDING
from pymongo.database import Database

from server.models.dispute_models import ItemDispute, SplitParticipants
from server.models.group_models import StoredGroup
from server.models.split_models import PersonSplit, SavedSplit, SplitResult
from server.models.user_models import User

SPLIT_HISTORY_LIMIT = 50


def convert_document_to_split(split_document: dict) -> SavedSplit:
    return SavedSplit(
        id=str(split_document["_id"]),
        payer=split_document["payer_username"],
        people=split_document["people"],
        total=split_document["total"],
        tax_note=split_document.get("tax_note"),
        store_name=split_document.get("store_name"),
        store_address=split_document.get("store_address"),
        purchase_date=split_document.get("purchase_date"),
        receipt_image_id=split_document.get("receipt_image_id"),
        group_id=split_document.get("group_id"),
        group_name=split_document.get("group_name"),
        created_by=split_document.get("created_by_username", split_document["payer_username"]),
        created_at=split_document["created_at"],
        disputes=[ItemDispute(**dispute) for dispute in split_document.get("disputes", [])],
    )


class SplitRepository:
    """Each confirmed receipt split is saved as its own document. Balances are summed from
    these records instead of stored, so the history always explains the totals."""

    def __init__(self, database: Database):
        self.splits_collection = database["splits"]
        self.splits_collection.create_index([("participant_ids", 1), ("created_at", DESCENDING)])
        self.splits_collection.create_index("payer_id")
        self.splits_collection.create_index("receipt_image_id", sparse=True)

    def create(
        self,
        payer_id: str,
        split_result: SplitResult,
        user_ids_by_username: dict[str, str],
        store_name: str | None,
        store_address: str | None,
        purchase_date: str | None,
        receipt_image_id: str | None,
        created_by: User,
        group: StoredGroup | None = None,
    ) -> SavedSplit:
        people = split_result.model_dump(mode="json")["people"]
        for person in people:
            person["user_id"] = user_ids_by_username[person["username"]]
            # Kept in cents so balances can be summed without float rounding.
            person["owes_cents"] = round(person["owes"] * 100)
        split_document = {
            "payer_id": payer_id,
            "payer_username": split_result.payer,
            "participant_ids": sorted({person["user_id"] for person in people} | {payer_id, created_by.id}),
            "people": people,
            "total": split_result.total,
            "tax_note": split_result.tax_note,
            "store_name": store_name,
            "store_address": store_address,
            "purchase_date": purchase_date,
            "receipt_image_id": receipt_image_id,
            "group_id": group.id if group else None,
            "group_name": group.name if group else None,
            "created_by_id": created_by.id,
            "created_by_username": created_by.username,
            "created_at": datetime.now(timezone.utc),
        }
        insert_result = self.splits_collection.insert_one(split_document)
        split_document["_id"] = insert_result.inserted_id
        return convert_document_to_split(split_document)

    def list_for_user(self, user_id: str) -> list[SavedSplit]:
        split_documents = (
            self.splits_collection.find({"participant_ids": user_id})
            .sort("created_at", DESCENDING)
            .limit(SPLIT_HISTORY_LIMIT)
        )
        return [convert_document_to_split(split_document) for split_document in split_documents]

    def list_for_user_between(self, user_id: str, start: datetime, end: datetime) -> list[SavedSplit]:
        split_documents = self.splits_collection.find(
            {"participant_ids": user_id, "created_at": {"$gte": start, "$lt": end}}
        ).sort("created_at", 1)
        return [convert_document_to_split(split_document) for split_document in split_documents]

    def sum_group_spending_since(self, group_ids: list[str], since: datetime) -> dict[str, int]:
        totals = self.splits_collection.aggregate(
            [
                {"$match": {"group_id": {"$in": group_ids}, "created_at": {"$gte": since}}},
                {"$group": {"_id": "$group_id", "total": {"$sum": "$total"}}},
            ]
        )
        return {total["_id"]: round(total["total"] * 100) for total in totals}

    def find_by_id(self, split_id: str) -> SavedSplit | None:
        if not ObjectId.is_valid(split_id):
            return None
        split_document = self.splits_collection.find_one({"_id": ObjectId(split_id)})
        return convert_document_to_split(split_document) if split_document else None

    def find_participants(self, split_id: str) -> SplitParticipants | None:
        if not ObjectId.is_valid(split_id):
            return None
        split_document = self.splits_collection.find_one(
            {"_id": ObjectId(split_id)}, {"payer_id": 1, "created_by_id": 1, "people": 1}
        )
        if split_document is None:
            return None
        return SplitParticipants(
            payer_id=split_document["payer_id"],
            created_by_id=split_document.get("created_by_id", split_document["payer_id"]),
            user_ids_by_username={person["username"]: person["user_id"] for person in split_document["people"]},
        )

    def add_dispute(self, split_id: str, dispute: ItemDispute, user_id: str) -> None:
        dispute_document = {**dispute.model_dump(), "user_id": user_id}
        self.splits_collection.update_one({"_id": ObjectId(split_id)}, {"$push": {"disputes": dispute_document}})

    def resolve_dispute(self, split_id: str, dispute_id: str, status: str, resolved_by: str) -> None:
        self.splits_collection.update_one(
            {"_id": ObjectId(split_id), "disputes.id": dispute_id},
            {
                "$set": {
                    "disputes.$.status": status,
                    "disputes.$.resolved_by": resolved_by,
                    "disputes.$.resolved_at": datetime.now(timezone.utc),
                }
            },
        )

    def set_person_share(self, split_id: str, user_id: str, person_split: PersonSplit) -> None:
        person_fields = person_split.model_dump(mode="json")
        updates = {f"people.$[person].{field}": value for field, value in person_fields.items()}
        updates["people.$[person].owes_cents"] = round(person_split.owes * 100)
        self.splits_collection.update_one(
            {"_id": ObjectId(split_id)}, {"$set": updates}, array_filters=[{"person.user_id": user_id}]
        )

    def rename_user(self, user_id: str, username: str) -> None:
        self.splits_collection.update_many({"payer_id": user_id}, {"$set": {"payer_username": username}})
        self.splits_collection.update_many({"created_by_id": user_id}, {"$set": {"created_by_username": username}})
        for split_document in self.splits_collection.find({"people.user_id": user_id}, {"people": 1}):
            people = [
                {**person, "username": username} if person["user_id"] == user_id else person
                for person in split_document["people"]
            ]
            self.splits_collection.update_one({"_id": split_document["_id"]}, {"$set": {"people": people}})
        self.splits_collection.update_many(
            {"disputes.user_id": user_id},
            {"$set": {"disputes.$[dispute].username": username}},
            array_filters=[{"dispute.user_id": user_id}],
        )

    def list_unpaid_splits(self, payer_id: str, debtor_id: str, limit: int) -> tuple[list[SavedSplit], int]:
        unpaid_filter = {
            "payer_id": payer_id,
            "people": {"$elemMatch": {"user_id": debtor_id, "owes_cents": {"$gt": 0}}},
        }
        split_documents = self.splits_collection.find(unpaid_filter).sort("created_at", DESCENDING).limit(limit)
        splits = [convert_document_to_split(split_document) for split_document in split_documents]
        return splits, self.splits_collection.count_documents(unpaid_filter)

    def is_receipt_image_shared_with(self, receipt_image_id: str, user_id: str) -> bool:
        return (
            self.splits_collection.find_one(
                {"receipt_image_id": receipt_image_id, "participant_ids": user_id}, {"_id": 1}
            )
            is not None
        )

    def sum_owed_to_payer(self, payer_id: str) -> dict[str, int]:
        """user id -> cents that user owes payer_id, across all of payer_id's splits."""
        totals = self.splits_collection.aggregate(
            [
                {"$match": {"payer_id": payer_id}},
                {"$unwind": "$people"},
                {"$group": {"_id": "$people.user_id", "owed_cents": {"$sum": "$people.owes_cents"}}},
            ]
        )
        return {total["_id"]: total["owed_cents"] for total in totals}

    def sum_owed_by_user(self, user_id: str) -> dict[str, int]:
        """payer id -> cents user_id owes that payer, across splits others paid for."""
        totals = self.splits_collection.aggregate(
            [
                {"$match": {"people.user_id": user_id, "payer_id": {"$ne": user_id}}},
                {"$unwind": "$people"},
                {"$match": {"people.user_id": user_id}},
                {"$group": {"_id": "$payer_id", "owed_cents": {"$sum": "$people.owes_cents"}}},
            ]
        )
        return {total["_id"]: total["owed_cents"] for total in totals}
