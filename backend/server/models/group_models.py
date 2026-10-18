from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from server.models.user_models import PublicProfile


class GroupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    member_usernames: list[str] = Field(default_factory=list)

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, name: object) -> str:
        return str(name).strip()

    @field_validator("member_usernames", mode="before")
    @classmethod
    def normalize_member_usernames(cls, member_usernames: object) -> list[str]:
        cleaned_usernames = [str(username).strip().lower().removeprefix("@") for username in member_usernames or []]
        return list(dict.fromkeys(username for username in cleaned_usernames if username))


class StoredGroup(BaseModel):
    id: str
    name: str
    owner_id: str
    member_ids: list[str]
    created_at: datetime


class Group(BaseModel):
    id: str
    name: str
    owner_username: str
    members: list[PublicProfile]
    shopping_list_id: str | None = None
    created_at: datetime
