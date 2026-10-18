from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

DisputeStatus = Literal["open", "dismissed", "removed"]


class ItemDispute(BaseModel):
    id: str
    item_id: str
    item_name: str
    username: str
    reason: str | None = None
    status: DisputeStatus = "open"
    created_at: datetime
    resolved_by: str | None = None
    resolved_at: datetime | None = None


class CreateDisputeRequest(BaseModel):
    item_id: str
    reason: str | None = Field(default=None, max_length=200)

    @field_validator("reason", mode="before")
    @classmethod
    def blank_reason_to_none(cls, reason: object) -> str | None:
        cleaned_reason = str(reason).strip() if reason is not None else ""
        return cleaned_reason or None


class ResolveDisputeRequest(BaseModel):
    resolution: Literal["dismissed", "removed"]


class SplitParticipants(BaseModel):
    payer_id: str
    created_by_id: str
    user_ids_by_username: dict[str, str]
