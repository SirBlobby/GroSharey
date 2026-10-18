from google.genai import types

from server.errors import BadRequestError
from server.models.receipt_models import ParsedReceipt, ParsedReceiptItem, Receipt
from server.services.gemini_client import GeminiClient, GeminiErrorMessages
from server.services.image_service import open_image

IMAGE_FORMAT_CONTENT_TYPES = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "WEBP": "image/webp",
}

SYSTEM_PROMPT = """You transcribe grocery receipts into structured data for an app that splits \
groceries between roommates, so every purchased line item matters.

- Include every purchased item. Do not include subtotal, tax, total, payment, change, \
or loyalty-points lines as items.
- The price printed on an item's line is the price before any discount. Coupons, \
instant savings, and member discounts are printed as their own line, usually right below \
the item, often with a trailing minus or the item's number (e.g. "/982859 4.00-"). \
Put the discount in that item's `discount` and set `total_price` = printed price - discount. \
Do not list discount lines as items. A discount that applies to the whole order (not one \
item) goes in `notes`.
- Only use prices printed on the receipt. If no per-unit price is printed, unit_price is \
null; never back-calculate one.
- Copy any tax marker letter printed after an item's price (e.g. A, E, T, N) into \
`tax_code` exactly as printed. Don't interpret it; markers mean different things at \
different stores. Use null if there is none.
- Check your work: the items' total_price values should add up to the printed subtotal. \
If they don't, re-check discounts and missed lines before answering.
- Weighed items (e.g. "1.32 lb @ $0.59/lb"): quantity = weight, unit_price = per-unit price.
- Store item codes and abbreviations ("ORG BNNA", "GV 2% MLK") go in raw_text verbatim; \
write a clear expanded name in `name`.
- Do not guess. If something is unreadable, use null where allowed and explain in `notes`."""


def find_total_mismatches(receipt: Receipt) -> list[str]:
    """Flag math mismatches so the app can ask the user to double-check."""
    warnings = []
    items_sum = round(sum(item.total_price for item in receipt.items), 2)
    if receipt.subtotal is not None and abs(items_sum - receipt.subtotal) > 0.01:
        warnings.append(f"Items add up to {items_sum:.2f} but the receipt subtotal is {receipt.subtotal:.2f}.")
    if receipt.subtotal is not None and receipt.total is not None:
        expected_total = round(receipt.subtotal + (receipt.tax or 0) + (receipt.tip or 0), 2)
        if abs(expected_total - receipt.total) > 0.01:
            warnings.append(
                f"Subtotal + tax + tip = {expected_total:.2f} but the receipt total is {receipt.total:.2f}."
            )
    if not receipt.items:
        warnings.append("No items were found on the receipt.")
    return warnings


def add_item_ids(receipt: Receipt) -> ParsedReceipt:
    items = [
        ParsedReceiptItem(id=f"item_{position}", **item.model_dump())
        for position, item in enumerate(receipt.items, start=1)
    ]
    return ParsedReceipt(
        **receipt.model_dump(exclude={"items"}),
        items=items,
        warnings=find_total_mismatches(receipt),
    )


RECEIPT_ERROR_MESSAGES = GeminiErrorMessages(
    not_configured="Receipt scanning is not configured on the server",
    rate_limited="Too many receipts at once. Try again in a minute.",
    failed="Couldn't read the receipt right now. Try again.",
    busy="Receipt scanning is busy right now. Try again in a few minutes.",
)


class ReceiptService:
    def __init__(self, gemini_client: GeminiClient):
        self.gemini_client = gemini_client

    def parse_receipt(self, image_bytes: bytes) -> ParsedReceipt:
        image_format = open_image(image_bytes).format
        content_type = IMAGE_FORMAT_CONTENT_TYPES.get(image_format)
        if content_type is None:
            raise BadRequestError("Receipt image must be JPEG, PNG, or WEBP")

        response = self.request_receipt_from_gemini(image_bytes, content_type)
        if response.prompt_feedback and response.prompt_feedback.block_reason:
            raise BadRequestError("This image couldn't be processed. Try a different photo.")
        if not isinstance(response.parsed, Receipt):
            raise BadRequestError("Couldn't read a receipt in this image. Try a clearer photo.")
        return add_item_ids(response.parsed)

    def request_receipt_from_gemini(self, image_bytes: bytes, content_type: str) -> types.GenerateContentResponse:
        return self.gemini_client.generate(
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=content_type),
                "Transcribe this receipt.",
            ],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                # Forces the reply to be JSON matching the Receipt schema.
                response_mime_type="application/json",
                response_schema=Receipt,
            ),
            error_messages=RECEIPT_ERROR_MESSAGES,
        )
