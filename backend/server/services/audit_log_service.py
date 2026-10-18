import logging

from server.models.audit_models import AuditCategory, AuditLogPage, AuditLogQuery, NotificationPage, NotificationQuery
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
        notify: bool = False,
    ) -> None:
        try:
            self.audit_log_repository.create(user_id, category, action, description, actor_username, notify=notify)
        except Exception:
            logger.exception("Could not record audit event %s for user %s", action, user_id)

    def list_events(self, user_id: str, audit_log_query: AuditLogQuery) -> AuditLogPage:
        events, total = self.audit_log_repository.list_for_user(
            user_id,
            audit_log_query.category,
            (audit_log_query.page - 1) * audit_log_query.page_size,
            audit_log_query.page_size,
        )
        return AuditLogPage(
            events=events, total=total, page=audit_log_query.page, page_size=audit_log_query.page_size
        )

    def list_notifications(self, user_id: str, notification_query: NotificationQuery) -> NotificationPage:
        notifications, total, unread_count = self.audit_log_repository.list_notifications(
            user_id,
            (notification_query.page - 1) * notification_query.page_size,
            notification_query.page_size,
        )
        return NotificationPage(
            notifications=notifications,
            total=total,
            unread_count=unread_count,
            page=notification_query.page,
            page_size=notification_query.page_size,
        )

    def mark_notifications_read(self, user_id: str, notification_ids: list[str] | None) -> None:
        self.audit_log_repository.mark_notifications_read(user_id, notification_ids)
