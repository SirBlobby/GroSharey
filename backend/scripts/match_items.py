import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from server.config import settings  # noqa: E402
from server.models.shopping_list_models import MatchableReceiptItem, StoredShoppingListItem  # noqa: E402
from server.services.gemini_client import GeminiClient  # noqa: E402
from server.services.item_matching_service import ItemMatchingService  # noqa: E402

RECEIPT_ITEMS = [
    MatchableReceiptItem(id="item_1", name="GV 2% MLK GAL"),
    MatchableReceiptItem(id="item_2", name="ORG BNNA"),
    MatchableReceiptItem(id="item_3", name="BOUNTY SAS 6PK"),
    MatchableReceiptItem(id="item_4", name="LG EGGS 18CT"),
    MatchableReceiptItem(id="item_5", name="DORITOS NACHO"),
    MatchableReceiptItem(id="item_6", name="CHOBANI GRK YGRT"),
]

SHOPPING_ITEMS_BY_REQUESTER = [
    ("list_1", "milk", "alice"),
    ("list_2", "bananas", "bob"),
    ("list_3", "paper towels", "alice"),
    ("list_4", "eggs", "carol"),
    ("list_5", "eggs", "bob"),
    ("list_6", "dish soap", "carol"),
    ("list_7", "greek yogurt", "carol"),
]

EXPECTED_MATCHES = {
    "item_1": {"list_1"},
    "item_2": {"list_2"},
    "item_3": {"list_3"},
    "item_4": {"list_4", "list_5"},
    "item_6": {"list_7"},
}


def build_shopping_items() -> list[StoredShoppingListItem]:
    created_at = datetime.now(timezone.utc)
    return [
        StoredShoppingListItem(id=item_id, name=name, requested_by_id=requester, created_at=created_at)
        for item_id, name, requester in SHOPPING_ITEMS_BY_REQUESTER
    ]


def main() -> int:
    if not settings.gemini_api_key:
        print("GEMINI_API_KEY is not set in backend/.env", file=sys.stderr)
        return 1

    gemini_client = GeminiClient(settings.gemini_api_key, settings.gemini_model, settings.gemini_fallback_model)
    matching_service = ItemMatchingService(gemini_client)
    shopping_items = build_shopping_items()
    shopping_items_by_id = {item.id: item for item in shopping_items}
    receipt_names_by_id = {item.id: item.name for item in RECEIPT_ITEMS}

    matches = matching_service.match_items(RECEIPT_ITEMS, shopping_items)

    for receipt_item_id, shopping_item_ids in matches.items():
        matched_names = [
            f"{shopping_items_by_id[shopping_item_id].name} (@{shopping_items_by_id[shopping_item_id].requested_by_id})"
            for shopping_item_id in shopping_item_ids
        ]
        print(f"{receipt_names_by_id[receipt_item_id]:<20} -> {', '.join(matched_names)}")

    failures = []
    for receipt_item_id in receipt_names_by_id:
        expected_ids = EXPECTED_MATCHES.get(receipt_item_id, set())
        actual_ids = set(matches.get(receipt_item_id, []))
        if expected_ids != actual_ids:
            failures.append(f"{receipt_names_by_id[receipt_item_id]}: expected {sorted(expected_ids)}, got {sorted(actual_ids)}")

    if failures:
        print("\nMismatches:")
        for failure in failures:
            print(f"  {failure}")
        return 1
    print("\nAll matches are correct")
    return 0


if __name__ == "__main__":
    sys.exit(main())
