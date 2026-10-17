from pydantic import BaseModel, Field

from server.models.profile_picture_models import MAX_BASE64_LENGTH


class ReceiptImageUpload(BaseModel):
    image_base64: str = Field(min_length=1, max_length=MAX_BASE64_LENGTH)


class ReceiptItem(BaseModel):
    name: str = Field(description="Human-readable item name, abbreviations expanded (e.g. 'Organic Bananas').")
    raw_text: str = Field(description="The item line exactly as printed on the receipt.")
    quantity: float = Field(description="Units or weight purchased. 1 if not shown.")
    unit_price: float | None = Field(description="Price per unit/lb if printed, else null.")
    discount: float = Field(description="Total discount/coupon applied to this item as a positive number, 0 if none.")
    total_price: float = Field(description="Final price paid for this line after discounts.")
    tax_code: str | None = Field(
        description="Tax marker letter printed next to the price (e.g. 'E', 'A', 'T'), copied as-is. "
        "Null if none is printed."
    )
    category: str = Field(
        description="One of: produce, meat_seafood, dairy, bakery, pantry, frozen, beverages, snacks, "
        "household, personal_care, other."
    )


class Receipt(BaseModel):
    """The shape Gemini is asked to fill in."""

    store_name: str | None
    store_address: str | None
    purchase_date: str | None = Field(description="YYYY-MM-DD if visible, else null.")
    purchase_time: str | None = Field(description="HH:MM (24h) if visible, else null.")
    currency: str = Field(description="ISO currency code, e.g. USD.")
    items: list[ReceiptItem]
    subtotal: float | None
    tax: float | None
    tip: float | None
    total: float | None
    payment_method: str | None = Field(description="e.g. 'VISA ****1234', 'cash', or null.")
    notes: str | None = Field(description="Anything unreadable or ambiguous, else null.")


class ParsedReceiptItem(ReceiptItem):
    id: str


class ParsedReceipt(Receipt):
    """What the API returns: item ids for roommate assignment, plus total-check warnings."""

    items: list[ParsedReceiptItem]
    warnings: list[str]
