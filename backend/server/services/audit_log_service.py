import logging

from server.models.audit_models import AuditCategory, AuditEvent
from server.repositories.audit_log_repository import AuditLogRepository

logger = logging.getLogger(__name__)


class AuditLogService:
    def __init__(self, audit_log_repository: AuditLogRepository):
        self.audit_log_repository = audit_log_repository

    def record(
        self,
        user_id: str,
        category: AuditCategory,
        action: str,
        description: str,
        actor_username: str | None = None,
    ) -> None:
        try:
            self.audit_log_repository.create(user_id, category, action, description, actor_username)
        except Exception:
            logger.exception("Could not record audit event %s for user %s", action, user_id)

    def list_events(self, user_id: str) -> list[AuditEvent]:
        return self.audit_log_repository.list_for_user(user_id)
