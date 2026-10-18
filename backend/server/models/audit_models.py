from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

AuditCategory = Literal["account", "profile", "friends", "splits", "payments"]


class AuditEvent(BaseModel):
    id: str
    category: AuditCategory
    action: str
    description: str
    actor_username: str | None
    created_at: datetime


class AuditLogQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    category: AuditCategory | None = None


class AuditLogPage(BaseModel):
    events: list[AuditEvent]
    total: int
    page: int
    page_size: int


class Notification(AuditEvent):
    is_read: bool


class NotificationQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=50)


class NotificationPage(BaseModel):
    notifications: list[Notification]
    total: int
    unread_count: int
    page: int
    page_size: int


class MarkNotificationsReadRequest(BaseModel):
    notification_ids: list[str] | None = None
