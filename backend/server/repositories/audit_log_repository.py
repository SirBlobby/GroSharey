from datetime import datetime, timezone

from bson import ObjectId
from pymongo import DESCENDING
from pymongo.database import Database

from server.models.audit_models import AuditCategory, AuditEvent, Notification

def convert_document_to_event(event_document: dict) -> AuditEvent:
    return AuditEvent(
        id=str(event_document["_id"]),
        category=event_document["category"],
        action=event_document["action"],
        description=event_document["description"],
        actor_username=event_document.get("actor_username"),
        created_at=event_document["created_at"],
    )


class AuditLogRepository:
    def __init__(self, database: Database):
        self.audit_events_collection = database["audit_events"]
        self.audit_events_collection.create_index([("user_id", 1), ("created_at", DESCENDING)])
        self.audit_events_collection.create_index("source_key", unique=True, sparse=True)

    def create(
        self,
        user_id: str,
        category: AuditCategory,
        action: str,
        description: str,
        actor_username: str | None,
        created_at: datetime | None = None,
        source_key: str | None = None,
        notify: bool = False,
    ) -> None:
        event_document = {
            "user_id": user_id,
            "category": category,
            "action": action,
            "description": description,
            "actor_username": actor_username,
            "created_at": created_at or datetime.now(timezone.utc),
        }
        if source_key:
            event_document["source_key"] = source_key
        if notify:
            event_document["notify"] = True
            event_document["is_read"] = False
        self.audit_events_collection.insert_one(event_document)

    def has_source_key(self, source_key: str) -> bool:
        return self.audit_events_collection.find_one({"source_key": source_key}, {"_id": 1}) is not None

    def find_first_live_event_time(self) -> datetime | None:
        first_event = self.audit_events_collection.find_one(
            {"source_key": {"$exists": False}}, {"created_at": 1}, sort=[("created_at", 1)]
        )
        return first_event["created_at"] if first_event else None

    def list_for_user(
        self, user_id: str, category: AuditCategory | None, skip: int, limit: int
    ) -> tuple[list[AuditEvent], int]:
        event_filter: dict = {"user_id": user_id}
        if category:
            event_filter["category"] = category
        event_documents = (
            self.audit_events_collection.find(event_filter)
            .sort([("created_at", DESCENDING), ("_id", DESCENDING)])
            .skip(skip)
            .limit(limit)
        )
        events = [convert_document_to_event(event_document) for event_document in event_documents]
        return events, self.audit_events_collection.count_documents(event_filter)

    def list_notifications(self, user_id: str, skip: int, limit: int) -> tuple[list[Notification], int, int]:
        notification_filter = {"user_id": user_id, "notify": True}
        notification_documents = (
            self.audit_events_collection.find(notification_filter)
            .sort([("created_at", DESCENDING), ("_id", DESCENDING)])
            .skip(skip)
            .limit(limit)
        )
        notifications = [
            Notification(
                **convert_document_to_event(notification_document).model_dump(),
                is_read=notification_document.get("is_read", False),
            )
            for notification_document in notification_documents
        ]
        total = self.audit_events_collection.count_documents(notification_filter)
        unread_count = self.audit_events_collection.count_documents({**notification_filter, "is_read": False})
        return notifications, total, unread_count

    def mark_notifications_read(self, user_id: str, notification_ids: list[str] | None) -> None:
        notification_filter: dict = {"user_id": user_id, "notify": True, "is_read": False}
        if notification_ids is not None:
            valid_ids = [
                ObjectId(notification_id) for notification_id in notification_ids if ObjectId.is_valid(notification_id)
            ]
            notification_filter["_id"] = {"$in": valid_ids}
        self.audit_events_collection.update_many(notification_filter, {"$set": {"is_read": True}})
