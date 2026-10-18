from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from server.models.user_models import PublicProfile


def strip_text(value: object) -> str:
    return str(value).strip()


class CreateShoppingListRequest(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    group_id: str | None = None

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, name: object) -> str:
        return strip_text(name)


class AddShoppingListItemRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    quantity: str | None = Field(default=None, max_length=30)
    store: str | None = Field(default=None, max_length=80)
    notes: str | None = Field(default=None, max_length=200)
    requested_by: str | None = None

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, name: object) -> str:
        return strip_text(name)

    @field_validator("quantity", "store", "notes", "requested_by", mode="before")
    @classmethod
    def blank_to_none(cls, value: object) -> str | None:
        cleaned_value = strip_text(value) if value is not None else ""
        return cleaned_value or None


class UpdateShoppingListItemRequest(BaseModel):
    is_crossed_off: bool


class StoredShoppingListItem(BaseModel):
    id: str
    name: str
    quantity: str | None = None
    store: str | None = None
    notes: str | None = None
    requested_by_id: str
    is_crossed_off: bool = False
    crossed_off_by_id: str | None = None
    crossed_off_at: datetime | None = None
    crossed_off_split_id: str | None = None
    bought_at: str | None = None
    created_at: datetime


class StoredPantryItem(BaseModel):
    id: str
    name: str
    name_key: str
    quantity: str | None = None
    store: str | None = None
    notes: str | None = None
    requested_by_id: str
    source_item_id: str | None = None
    stocked_at: datetime
    is_running_low: bool = False


class StoredShoppingList(BaseModel):
    id: str
    name: str
    owner_id: str
    group_id: str | None = None
    items: list[StoredShoppingListItem]
    pantry: list[StoredPantryItem] = []
    created_at: datetime


class ShoppingListItem(BaseModel):
    id: str
    name: str
    quantity: str | None
    store: str | None
    notes: str | None
    requested_by: str
    is_crossed_off: bool
    crossed_off_by: str | None
    crossed_off_at: datetime | None
    bought_at: str | None
    created_at: datetime


class PantryItem(BaseModel):
    id: str
    name: str
    quantity: str | None
    store: str | None
    notes: str | None
    requested_by: str
    stocked_at: datetime
    is_running_low: bool


class ShoppingList(BaseModel):
    id: str
    name: str
    owner_username: str
    group_id: str | None
    group_name: str | None
    members: list[PublicProfile]
    items: list[ShoppingListItem]
    pantry: list[PantryItem]
    created_at: datetime


class MatchableReceiptItem(BaseModel):
    id: str
    name: str = Field(min_length=1, max_length=120)


class MatchItemsRequest(BaseModel):
    items: list[MatchableReceiptItem] = Field(min_length=1)


class GroupItemMatches(BaseModel):
    shopping_list_id: str | None
    shopping_list_name: str | None
    assignments: dict[str, list[str]]
    matches: dict[str, list[str]]
