from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from server.models.user_models import PublicProfile


class GroupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    member_usernames: list[str] = Field(default_factory=list)
    monthly_budget: float | None = Field(default=None, ge=0, le=100000)

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, name: object) -> str:
        return str(name).strip()

    @field_validator("member_usernames", mode="before")
    @classmethod
    def normalize_member_usernames(cls, member_usernames: object) -> list[str]:
        cleaned_usernames = [str(username).strip().lower().removeprefix("@") for username in member_usernames or []]
        return list(dict.fromkeys(username for username in cleaned_usernames if username))


class StartTripRequest(BaseModel):
    store: str = Field(min_length=1, max_length=80)

    @field_validator("store", mode="before")
    @classmethod
    def strip_store(cls, store: object) -> str:
        return str(store).strip()


class StoredTrip(BaseModel):
    shopper_id: str
    store: str
    started_at: datetime


class ShoppingTrip(BaseModel):
    shopper_username: str
    store: str
    started_at: datetime


class StoredGroup(BaseModel):
    id: str
    name: str
    owner_id: str
    member_ids: list[str]
    active_trip: StoredTrip | None = None
    monthly_budget: float | None = None
    created_at: datetime


class Group(BaseModel):
    id: str
    name: str
    owner_username: str
    members: list[PublicProfile]
    shopping_list_id: str | None = None
    active_trip: ShoppingTrip | None = None
    monthly_budget: float | None = None
    month_spent: float = 0
    created_at: datetime
