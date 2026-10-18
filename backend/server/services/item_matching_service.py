import json

from google.genai import types
from pydantic import BaseModel

from server.models.shopping_list_models import MatchableReceiptItem, StoredShoppingListItem
from server.services.gemini_client import GeminiClient, GeminiErrorMessages

MATCHING_PROMPT = """You match grocery receipt lines to items roommates asked for on a shared \
shopping list, so the app knows who each purchased item is for.

- Match a receipt item to a shopping list item only when it is clearly the same product or an \
obvious version of it. "milk" matches "2% Milk Gallon", "apples" matches "Gala Apples 3 lb", \
"paper towels" matches "Bounty Select-A-Size".
- Receipt names can be abbreviated store codes ("ORG BNNA", "GV 2% MLK"). Expand them in your head \
before comparing.
- Do not match items that only share a brand, a category, or a single generic word.
- Each shopping list item can match at most one receipt item. A receipt item can match several \
shopping list items when more than one person asked for the same thing.
- Shopping list notes are hints from the person who asked (e.g. "the oat milk kind"). Use them to \
pick between similar receipt items, but still match a close version when the note isn't followed exactly.
- Ignore where the item was bought. Shopping list items are matched by product only, even when \
someone asked for it from a different store.
- Leave items unmatched when unsure. Only use ids from the input."""

MATCHING_ERROR_MESSAGES = GeminiErrorMessages(
    not_configured="Item matching is not configured on the server",
    rate_limited="Too many matching requests at once. Try again in a minute.",
    failed="Couldn't match items to the shopping list right now. Try again.",
    busy="Item matching is busy right now. Try again in a few minutes.",
)


class ItemMatch(BaseModel):
    receipt_item_id: str
    shopping_item_ids: list[str]


class ItemMatchResult(BaseModel):
    matches: list[ItemMatch]


def build_matching_input(
    receipt_items: list[MatchableReceiptItem], shopping_items: list[StoredShoppingListItem]
) -> str:
    matching_input = {
        "receipt_items": [{"id": item.id, "name": item.name} for item in receipt_items],
        "shopping_list_items": [
            {"id": item.id, "name": item.name, "quantity": item.quantity, "notes": item.notes}
            for item in shopping_items
        ],
    }
    return json.dumps(matching_input)


def keep_valid_matches(
    item_match_result: ItemMatchResult,
    receipt_items: list[MatchableReceiptItem],
    shopping_items: list[StoredShoppingListItem],
) -> dict[str, list[str]]:
    receipt_item_ids = {item.id for item in receipt_items}
    unclaimed_shopping_item_ids = {item.id for item in shopping_items}
    matches: dict[str, list[str]] = {}
    for item_match in item_match_result.matches:
        if item_match.receipt_item_id not in receipt_item_ids:
            continue
        claimed_ids = [
            shopping_item_id
            for shopping_item_id in dict.fromkeys(item_match.shopping_item_ids)
            if shopping_item_id in unclaimed_shopping_item_ids
        ]
        unclaimed_shopping_item_ids -= set(claimed_ids)
        if claimed_ids:
            matches.setdefault(item_match.receipt_item_id, []).extend(claimed_ids)
    return matches


class ItemMatchingService:
    def __init__(self, gemini_client: GeminiClient):
        self.gemini_client = gemini_client

    def match_items(
        self, receipt_items: list[MatchableReceiptItem], shopping_items: list[StoredShoppingListItem]
    ) -> dict[str, list[str]]:
        if not receipt_items or not shopping_items:
            return {}
        response = self.gemini_client.generate(
            contents=[build_matching_input(receipt_items, shopping_items)],
            config=types.GenerateContentConfig(
                system_instruction=MATCHING_PROMPT,
                response_mime_type="application/json",
                response_schema=ItemMatchResult,
            ),
            error_messages=MATCHING_ERROR_MESSAGES,
        )
        if not isinstance(response.parsed, ItemMatchResult):
            return {}
        return keep_valid_matches(response.parsed, receipt_items, shopping_items)
