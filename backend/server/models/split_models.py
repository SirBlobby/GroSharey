from datetime import datetime

from pydantic import BaseModel, Field


class SplitReceiptItem(BaseModel):
    id: str
    name: str
    total_price: float
    tax_code: str | None = None


class SplitReceipt(BaseModel):
    """A parsed receipt from /api/receipts/parse fits this, and so do manually entered items."""

    store_name: str | None = None
    purchase_date: str | None = None
    items: list[SplitReceiptItem] = Field(min_length=1)
    tax: float | None = None
    tip: float | None = None


class SplitRequest(BaseModel):
    receipt: SplitReceipt
    # item id -> usernames sharing that item (the payer can be one of them)
    assignments: dict[str, list[str]] = Field(min_length=1)


class ItemShare(BaseModel):
    item_id: str
    name: str
    price: float
    tax: float
    total: float


class PersonSplit(BaseModel):
    username: str
    items: list[ItemShare]
    subtotal: float
    tax: float
    tip: float
    total: float
    # What this person owes the payer. 0 for the payer.
    owes: float


class SplitResult(BaseModel):
    payer: str
    people: list[PersonSplit]
    total: float
    # Set when the tax couldn't be pinned to specific items and was spread across all of them.
    tax_note: str | None


class SavedSplit(SplitResult):
    id: str
    store_name: str | None
    purchase_date: str | None
    created_at: datetime
