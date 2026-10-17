import logging

from google import genai
from google.genai import errors as gemini_errors
from google.genai import types

from server.errors import BadRequestError, ExternalServiceError, RateLimitError
from server.models.receipt_models import ParsedReceipt, ParsedReceiptItem, Receipt
from server.services.image_service import open_image

logger = logging.getLogger(__name__)

IMAGE_FORMAT_CONTENT_TYPES = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "WEBP": "image/webp",
}

SYSTEM_PROMPT = """You transcribe grocery receipts into structured data for an app that splits \
groceries between roommates, so every purchased line item matters.

- Include every purchased item. Do not include subtotal, tax, total, payment, change, \
or loyalty-points lines as items.
- Coupons, member savings, or discount lines that apply to an item go into that item's \
`discount`, and `total_price` is the amount after the discount. A discount that applies \
to the whole order (not one item) goes in `notes`.
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


class ReceiptService:
    def __init__(self, gemini_api_key: str, gemini_model: str):
        self.gemini_api_key = gemini_api_key
        self.gemini_model = gemini_model
        self.gemini_client: genai.Client | None = None

    def get_gemini_client(self) -> genai.Client:
        if not self.gemini_api_key:
            logger.error("GEMINI_API_KEY is not set")
            raise ExternalServiceError("Receipt scanning is not configured on the server")
        if self.gemini_client is None:
            self.gemini_client = genai.Client(api_key=self.gemini_api_key)
        return self.gemini_client

    def parse_receipt(self, image_bytes: bytes) -> ParsedReceipt:
        image_format = open_image(image_bytes).format
        content_type = IMAGE_FORMAT_CONTENT_TYPES.get(image_format)
        if content_type is None:
            raise BadRequestError("Receipt image must be JPEG, PNG, or WEBP")

        try:
            response = self.get_gemini_client().models.generate_content(
                model=self.gemini_model,
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
            )
        except gemini_errors.APIError as error:
            if error.code == 429:
                raise RateLimitError("Too many receipts at once. Try again in a minute.")
            logger.exception("Gemini request failed")
            raise ExternalServiceError("Couldn't read the receipt right now. Try again.")

        if response.prompt_feedback and response.prompt_feedback.block_reason:
            raise BadRequestError("This image couldn't be processed. Try a different photo.")
        if not isinstance(response.parsed, Receipt):
            raise BadRequestError("Couldn't read a receipt in this image. Try a clearer photo.")
        return add_item_ids(response.parsed)
