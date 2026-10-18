import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

PaymentMethod = Literal["venmo", "paypal", "cash", "other"]


class RecordPaymentRequest(BaseModel):
    friend_username: str
    amount: float = Field(gt=0)
    # "paid": you paid the friend. "received": the friend paid you.
    direction: Literal["paid", "received"]
    method: PaymentMethod = "other"

    @field_validator("friend_username", mode="before")
    @classmethod
    def normalize_username(cls, username: object) -> str:
        return str(username).strip().lower()


PAYMENT_HANDLE_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,50}$")


class PaymentHandlesUpdate(BaseModel):
    """Venmo username and PayPal.me name, so friends can pay you with one tap."""

    venmo_username: str | None = None
    paypal_username: str | None = None

    @field_validator("venmo_username", "paypal_username", mode="before")
    @classmethod
    def clean_handle(cls, handle: object) -> str | None:
        if handle is None:
            return None
        cleaned_handle = str(handle).strip().removeprefix("@")
        if not cleaned_handle:
            return None
        if not PAYMENT_HANDLE_PATTERN.match(cleaned_handle):
            raise ValueError("Use only letters, numbers, dashes, or underscores")
        return cleaned_handle


class Payment(BaseModel):
    id: str
    from_username: str
    to_username: str
    amount: float
    method: PaymentMethod
    recorded_by: str
    created_at: datetime
    # True when the person who got paid was emailed about it (only set when recording).
    recipient_emailed: bool = False
