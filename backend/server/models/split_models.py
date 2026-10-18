from pydantic import BaseModel, Field

from server.models.receipt_models import ParsedReceipt


class SplitRequest(BaseModel):
    receipt: ParsedReceipt
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
