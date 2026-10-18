from datetime import datetime
from typing import Literal

from pydantic import BaseModel

AuditCategory = Literal["account", "profile", "friends", "splits", "payments"]


class AuditEvent(BaseModel):
    id: str
    category: AuditCategory
    action: str
    description: str
    actor_username: str | None
    created_at: datetime
