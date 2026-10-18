from datetime import datetime, timezone

from pymongo import DESCENDING
from pymongo.database import Database

from server.models.split_models import SavedSplit, SplitResult
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
        created_by=split_document.get("created_by_username", split_document["payer_username"]),
        created_at=split_document["created_at"],
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
