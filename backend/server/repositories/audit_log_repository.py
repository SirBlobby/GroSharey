from datetime import datetime, timezone

from pymongo import DESCENDING
from pymongo.database import Database

from server.models.audit_models import AuditCategory, AuditEvent

AUDIT_LOG_LIMIT = 200


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

    def create(
        self,
        user_id: str,
        category: AuditCategory,
        action: str,
        description: str,
        actor_username: str | None,
    ) -> None:
        self.audit_events_collection.insert_one(
            {
                "user_id": user_id,
                "category": category,
                "action": action,
                "description": description,
                "actor_username": actor_username,
                "created_at": datetime.now(timezone.utc),
            }
        )

    def list_for_user(self, user_id: str) -> list[AuditEvent]:
        event_documents = (
            self.audit_events_collection.find({"user_id": user_id})
            .sort("created_at", DESCENDING)
            .limit(AUDIT_LOG_LIMIT)
        )
        return [convert_document_to_event(event_document) for event_document in event_documents]
