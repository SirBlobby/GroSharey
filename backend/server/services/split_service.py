"""Splits a parsed receipt between roommates.

All math is in integer cents. Whenever an amount has to be divided, leftover pennies
are handed out one at a time (largest remainder first), so every split adds up exactly
to the receipt.
"""

from itertools import combinations

from server.errors import BadRequestError
from server.models.receipt_models import ParsedReceipt, ParsedReceiptItem
from server.models.split_models import ItemShare, PersonSplit, SplitResult

# Real tax rates are round numbers (6%, 7.25%, 5.3%, 8.875%). Rounder rates are checked
# first, so "6% on some items" wins over "4.325% on everything" when both fit.
TAX_RATE_STEPS = (0.0025, 0.0005, 0.00025)
MIN_TAX_RATE = 0.005
MAX_TAX_RATE = 0.15
UNCLEAR_TAX_NOTE = (
    "We couldn't tell which items were taxed, so tax was split across all items by price. "
    "Adjust if needed."
)


def to_cents(amount: float | None) -> int:
    return round((amount or 0) * 100)


def to_dollars(cents: int) -> float:
    return cents / 100


def allocate_cents(total_cents: int, weights: list[int]) -> list[int]:
    """Splits total_cents in proportion to weights; the parts always sum to total_cents."""
    if total_cents == 0 or not weights:
        return [0] * len(weights)
    weight_sum = sum(weights)
    if weight_sum <= 0:
        weights = [1] * len(weights)
        weight_sum = len(weights)
    exact_parts = [total_cents * weight / weight_sum for weight in weights]
    parts = [int(exact_part) for exact_part in exact_parts]
    leftover = total_cents - sum(parts)
    by_remainder = sorted(range(len(weights)), key=lambda index: exact_parts[index] - parts[index], reverse=True)
    for index in by_remainder[:leftover]:
        parts[index] += 1
    return parts


def rate_fits(tax_cents: int, taxed_cents: int, rate_step: float) -> bool:
    """True if a realistic rate (a multiple of rate_step) on taxed_cents gives tax_cents, within a cent."""
    if taxed_cents <= 0:
        return False
    rate = round(tax_cents / taxed_cents / rate_step) * rate_step
    return MIN_TAX_RATE <= rate <= MAX_TAX_RATE and abs(taxed_cents * rate - tax_cents) <= 1


def find_taxed_items(items: list[ParsedReceiptItem], tax_cents: int) -> tuple[list[bool], str | None]:
    """Works out which items the receipt's tax applies to, using the printed tax codes.

    Returns one flag per item, plus a note if it had to fall back to taxing everything.
    """
    if tax_cents == 0:
        return [False] * len(items), None

    tax_codes = sorted({item.tax_code or "" for item in items})
    if len(tax_codes) == 1:
        return [True] * len(items), None

    # Mixed codes: find the group of codes whose items' total explains the tax amount.
    code_groups = [
        set(code_group)
        for group_size in range(1, len(tax_codes) + 1)
        for code_group in combinations(tax_codes, group_size)
    ]
    for rate_step in TAX_RATE_STEPS:
        matching_code_groups = [
            code_group
            for code_group in code_groups
            if rate_fits(
                tax_cents,
                sum(to_cents(item.total_price) for item in items if (item.tax_code or "") in code_group),
                rate_step,
            )
        ]
        if len(matching_code_groups) == 1:
            taxed_codes = matching_code_groups[0]
            return [(item.tax_code or "") in taxed_codes for item in items], None
        if matching_code_groups:
            break  # several explanations fit equally well; finer rates won't settle it
    return [True] * len(items), UNCLEAR_TAX_NOTE


def split_receipt(receipt: ParsedReceipt, assignments: dict[str, list[str]], payer: str) -> SplitResult:
    items_by_id = {item.id: item for item in receipt.items}

    unknown_item_ids = sorted(set(assignments) - set(items_by_id))
    if unknown_item_ids:
        raise BadRequestError(f"Unknown item ids: {', '.join(unknown_item_ids)}")
    unassigned_item_ids = [item.id for item in receipt.items if not assignments.get(item.id)]
    if unassigned_item_ids:
        raise BadRequestError(f"Assign at least one person to: {', '.join(unassigned_item_ids)}")

    item_cents = [to_cents(item.total_price) for item in receipt.items]
    tax_cents = to_cents(receipt.tax)
    taxed_flags, tax_note = find_taxed_items(receipt.items, tax_cents)
    item_tax_cents = allocate_cents(
        tax_cents, [cents if is_taxed else 0 for cents, is_taxed in zip(item_cents, taxed_flags)]
    )
    item_tip_cents = allocate_cents(to_cents(receipt.tip), item_cents)

    people: dict[str, dict] = {}
    for item, price_cents, tax_share_cents, tip_share_cents in zip(
        receipt.items, item_cents, item_tax_cents, item_tip_cents
    ):
        usernames = list(dict.fromkeys(username.strip().lower() for username in assignments[item.id]))
        even_weights = [1] * len(usernames)
        price_parts = allocate_cents(price_cents, even_weights)
        tax_parts = allocate_cents(tax_share_cents, even_weights)
        tip_parts = allocate_cents(tip_share_cents, even_weights)
        for username, price_part, tax_part, tip_part in zip(usernames, price_parts, tax_parts, tip_parts):
            person = people.setdefault(username, {"items": [], "price": 0, "tax": 0, "tip": 0})
            person["items"].append(
                ItemShare(
                    item_id=item.id,
                    name=item.name,
                    price=to_dollars(price_part),
                    tax=to_dollars(tax_part),
                    total=to_dollars(price_part + tax_part),
                )
            )
            person["price"] += price_part
            person["tax"] += tax_part
            person["tip"] += tip_part

    person_splits = []
    for username, person in people.items():
        total_cents = person["price"] + person["tax"] + person["tip"]
        person_splits.append(
            PersonSplit(
                username=username,
                items=person["items"],
                subtotal=to_dollars(person["price"]),
                tax=to_dollars(person["tax"]),
                tip=to_dollars(person["tip"]),
                total=to_dollars(total_cents),
                owes=0 if username == payer else to_dollars(total_cents),
            )
        )

    return SplitResult(
        payer=payer,
        people=person_splits,
        total=to_dollars(sum(item_cents) + tax_cents + to_cents(receipt.tip)),
        tax_note=tax_note,
    )
