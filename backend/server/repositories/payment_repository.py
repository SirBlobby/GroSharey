from datetime import datetime, timezone

from bson import ObjectId
from pymongo import DESCENDING
from pymongo.database import Database

from server.models.payment_models import Payment, PaymentMethod, PaymentStatus
from server.models.user_models import StoredUser, User

PAYMENT_HISTORY_LIMIT = 50
CONFIRMED_ONLY = {"status": {"$ne": "pending"}}


def convert_document_to_payment(payment_document: dict) -> Payment:
    return Payment(
        id=str(payment_document["_id"]),
        from_username=payment_document["from_username"],
        to_username=payment_document["to_username"],
        amount=payment_document["amount_cents"] / 100,
        method=payment_document["method"],
        recorded_by=payment_document["recorded_by_username"],
        status=payment_document.get("status", "confirmed"),
        confirmed_at=payment_document.get("confirmed_at"),
        created_at=payment_document["created_at"],
    )


class PaymentRepository:
    """Each settle-up payment is its own document, like splits, so balances stay explainable."""

    def __init__(self, database: Database):
        self.payments_collection = database["payments"]
        self.payments_collection.create_index([("participant_ids", 1), ("created_at", DESCENDING)])

    def create(
        self,
        from_user: StoredUser | User,
        to_user: StoredUser | User,
        amount_cents: int,
        method: PaymentMethod,
        recorded_by: User,
        status: PaymentStatus,
    ) -> Payment:
        payment_document = {
            "from_user_id": from_user.id,
            "from_username": from_user.username,
            "to_user_id": to_user.id,
            "to_username": to_user.username,
            "participant_ids": sorted((from_user.id, to_user.id)),
            "amount_cents": amount_cents,
            "method": method,
            "recorded_by_user_id": recorded_by.id,
            "recorded_by_username": recorded_by.username,
            "status": status,
            "confirmed_at": datetime.now(timezone.utc) if status == "confirmed" else None,
            "created_at": datetime.now(timezone.utc),
        }
        insert_result = self.payments_collection.insert_one(payment_document)
        payment_document["_id"] = insert_result.inserted_id
        return convert_document_to_payment(payment_document)

    def list_for_user(self, user_id: str) -> list[Payment]:
        payment_documents = (
            self.payments_collection.find({"participant_ids": user_id})
            .sort("created_at", DESCENDING)
            .limit(PAYMENT_HISTORY_LIMIT)
        )
        return [convert_document_to_payment(payment_document) for payment_document in payment_documents]

    def list_pending_for_user(self, user_id: str) -> list[Payment]:
        payment_documents = self.payments_collection.find(
            {"participant_ids": user_id, "status": "pending"}
        ).sort("created_at", DESCENDING)
        return [convert_document_to_payment(payment_document) for payment_document in payment_documents]

    def find_pending_for_recipient(self, payment_id: str, recipient_id: str) -> Payment | None:
        if not ObjectId.is_valid(payment_id):
            return None
        payment_document = self.payments_collection.find_one(
            {"_id": ObjectId(payment_id), "to_user_id": recipient_id, "status": "pending"}
        )
        return convert_document_to_payment(payment_document) if payment_document else None

    def find_user_ids(self, payment_id: str) -> tuple[str, str] | None:
        payment_document = self.payments_collection.find_one(
            {"_id": ObjectId(payment_id)}, {"from_user_id": 1, "to_user_id": 1}
        )
        return (payment_document["from_user_id"], payment_document["to_user_id"]) if payment_document else None

    def confirm(self, payment_id: str) -> None:
        self.payments_collection.update_one(
            {"_id": ObjectId(payment_id)},
            {"$set": {"status": "confirmed", "confirmed_at": datetime.now(timezone.utc)}},
        )

    def sum_paid_to_user(self, user_id: str) -> dict[str, int]:
        """sender id -> cents that sender has paid user_id."""
        return self.sum_amounts({"to_user_id": user_id, **CONFIRMED_ONLY}, "$from_user_id")

    def sum_paid_by_user(self, user_id: str) -> dict[str, int]:
        """recipient id -> cents user_id has paid that recipient."""
        return self.sum_amounts({"from_user_id": user_id, **CONFIRMED_ONLY}, "$to_user_id")

    def sum_amounts(self, match: dict, group_by_field: str) -> dict[str, int]:
        totals = self.payments_collection.aggregate(
            [
                {"$match": match},
                {"$group": {"_id": group_by_field, "amount_cents": {"$sum": "$amount_cents"}}},
            ]
        )
        return {total["_id"]: total["amount_cents"] for total in totals}

    def rename_user(self, user_id: str, username: str) -> None:
        for id_field, username_field in (
            ("from_user_id", "from_username"),
            ("to_user_id", "to_username"),
            ("recorded_by_user_id", "recorded_by_username"),
        ):
            self.payments_collection.update_many({id_field: user_id}, {"$set": {username_field: username}})
