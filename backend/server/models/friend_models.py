from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from server.models.user_models import PublicProfile


class AddFriendRequest(BaseModel):
    username: str

    @field_validator("username", mode="before")
    @classmethod
    def normalize_username(cls, username: object) -> str:
        return str(username).strip().lower()


class Friend(PublicProfile):
    # Positive: they owe you. Negative: you owe them. Includes recorded payments.
    balance: float
    venmo_username: str | None = None
    paypal_username: str | None = None
    # Set only when you owe this friend and they've added that handle; opens the payment with the amount filled in.
    venmo_pay_url: str | None = None
    paypal_pay_url: str | None = None


class ReminderRequest(BaseModel):
    usernames: list[str] | None = Field(default=None, max_length=50)


class ReminderResult(BaseModel):
    reminded: list[str]
    reminded_recently: list[str]
    next_reminder_times: dict[str, datetime]
    emailed: list[str]
