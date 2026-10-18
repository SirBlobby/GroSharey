from datetime import datetime, timezone

from pymongo.database import Database

from server.database import get_database
from server.models.audit_models import AuditCategory
from server.repositories.audit_log_repository import AuditLogRepository
from server.services.audit_messages import describe_added_to_split, describe_payment, describe_saved_split


class AuditLogBackfill:
    def __init__(self, database: Database):
        self.database = database
        self.audit_log_repository = AuditLogRepository(database)
        self.usernames_by_id = {
            str(user_document["_id"]): user_document["username"]
            for user_document in database["users"].find({}, {"username": 1})
        }
        self.created_count = 0

    def add_event(
        self,
        source_key: str,
        user_id: str,
        category: AuditCategory,
        action: str,
        description: str,
        actor_username: str | None,
        created_at: datetime,
    ) -> None:
        if self.audit_log_repository.has_source_key(source_key):
            return
        self.audit_log_repository.create(
            user_id, category, action, description, actor_username, created_at, source_key
        )
        self.created_count += 1

    def backfill_friendships(self, before: datetime) -> None:
        for friendship in self.database["friendships"].find({"created_at": {"$lt": before}}):
            first_user_id, second_user_id = friendship["user_ids"]
            for user_id, other_user_id in ((first_user_id, second_user_id), (second_user_id, first_user_id)):
                other_username = self.usernames_by_id.get(other_user_id, "unknown")
                self.add_event(
                    f"friendship:{friendship['_id']}:{user_id}",
                    user_id,
                    "friends",
                    "added_friend",
                    f"You and @{other_username} became friends",
                    None,
                    friendship["created_at"],
                )

    def backfill_splits(self, before: datetime) -> None:
        for split in self.database["splits"].find({"created_at": {"$lt": before}}):
            payer_username = split["payer_username"]
            self.add_event(
                f"split:{split['_id']}:{split['payer_id']}",
                split["payer_id"],
                "splits",
                "saved_split",
                describe_saved_split(split.get("store_name"), split["total"]),
                payer_username,
                split["created_at"],
            )
            for person in split["people"]:
                if person["user_id"] == split["payer_id"]:
                    continue
                self.add_event(
                    f"split:{split['_id']}:{person['user_id']}",
                    person["user_id"],
                    "splits",
                    "added_to_split",
                    describe_added_to_split(payer_username, split.get("store_name"), person["owes"]),
                    payer_username,
                    split["created_at"],
                )

    def backfill_payments(self, before: datetime) -> None:
        for payment in self.database["payments"].find({"created_at": {"$lt": before}}):
            payment_summary = describe_payment(
                payment["amount_cents"], payment["from_username"], payment["to_username"]
            )
            recorder_id = payment["recorded_by_user_id"]
            recorder_username = payment["recorded_by_username"]
            for user_id in (payment["from_user_id"], payment["to_user_id"]):
                description = (
                    f"You recorded a {payment_summary}"
                    if user_id == recorder_id
                    else f"@{recorder_username} recorded a {payment_summary}"
                )
                self.add_event(
                    f"payment:{payment['_id']}:{user_id}",
                    user_id,
                    "payments",
                    "recorded_payment",
                    description,
                    recorder_username,
                    payment["created_at"],
                )

    def run(self) -> int:
        before = self.audit_log_repository.find_first_live_event_time() or datetime.now(timezone.utc)
        self.backfill_friendships(before)
        self.backfill_splits(before)
        self.backfill_payments(before)
        return self.created_count


def backfill_audit_log(database: Database) -> int:
    return AuditLogBackfill(database).run()


if __name__ == "__main__":
    created_count = backfill_audit_log(get_database())
    print(f"Added {created_count} audit log events from existing friendships, splits, and payments")
