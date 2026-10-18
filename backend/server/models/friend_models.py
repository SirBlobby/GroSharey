from pydantic import BaseModel, field_validator

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
