from pydantic import BaseModel, field_validator

from server.models.user_models import PublicProfile


class AddFriendRequest(BaseModel):
    username: str

    @field_validator("username", mode="before")
    @classmethod
    def normalize_username(cls, username: object) -> str:
        return str(username).strip().lower()


class Friend(PublicProfile):
    # Positive: they owe you. Negative: you owe them.
    balance: float
