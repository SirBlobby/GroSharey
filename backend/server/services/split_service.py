"""Splits a parsed receipt between roommates.

All math is in integer cents. Whenever an amount has to be divided, leftover pennies
are handed out one at a time (largest remainder first), so every split adds up exactly
to the receipt.
"""

from itertools import combinations

from server.errors import BadRequestError
from server.models.group_models import StoredGroup
from server.models.split_models import (
    ItemShare,
    PersonSplit,
    SavedSplit,
    SplitReceipt,
    SplitReceiptItem,
    SplitRequest,
    SplitResult,
)
from server.models.user_models import StoredUser, User
from server.repositories.friendship_repository import FriendshipRepository
from server.repositories.split_repository import SplitRepository
from server.repositories.user_repository import UserRepository
from server.services.audit_log_service import AuditLogService
from server.services.audit_messages import (
    describe_added_to_split,
    describe_recorded_as_payer,
    describe_saved_split,
)
from server.services.group_service import GroupService
from server.services.notification_service import NotificationService
from server.services.receipt_image_service import ReceiptImageService
from server.services.shopping_list_matching_service import ShoppingListMatchingService
from server.services.user_mapper import convert_to_user

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


def find_taxed_items(items: list[SplitReceiptItem], tax_cents: int) -> tuple[list[bool], str | None]:
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


def normalize_username(username: str) -> str:
    return username.strip().lower()


def split_receipt(receipt: SplitReceipt, assignments: dict[str, list[str]], payer: str) -> SplitResult:
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
        usernames = list(dict.fromkeys(normalize_username(username) for username in assignments[item.id]))
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


def apply_upfront_payments(
    split_result: SplitResult, paid_in_full: list[str], paid_amounts: dict[str, float]
) -> SplitResult:
    people_by_username = {person.username: person for person in split_result.people}
    full_usernames = {normalize_username(username) for username in paid_in_full}
    paid_cents_by_username = {
        normalize_username(username): to_cents(amount) for username, amount in paid_amounts.items() if amount
    }
    unknown_usernames = sorted((full_usernames | set(paid_cents_by_username)) - set(people_by_username))
    if unknown_usernames:
        raise BadRequestError(f"Not part of this split: {', '.join(unknown_usernames)}")

    people = []
    for person in split_result.people:
        owes_cents = to_cents(person.owes)
        if person.username in full_usernames:
            paid_cents = owes_cents
        else:
            paid_cents = paid_cents_by_username.get(person.username, 0)
        if paid_cents < 0:
            raise BadRequestError("Paid amounts can't be negative")
        if person.username == split_result.payer and paid_cents:
            raise BadRequestError(f"@{person.username} paid at the store, so they can't also pay themselves")
        remaining_cents = owes_cents - paid_cents
        people.append(person.model_copy(update={"paid": to_dollars(paid_cents), "owes": to_dollars(remaining_cents)}))
    return split_result.model_copy(update={"people": people})


class SplitService:
    def __init__(
        self,
        user_repository: UserRepository,
        friendship_repository: FriendshipRepository,
        split_repository: SplitRepository,
        notification_service: NotificationService,
        receipt_image_service: ReceiptImageService,
        audit_log_service: AuditLogService,
        group_service: GroupService,
        shopping_list_matching_service: ShoppingListMatchingService,
    ):
        self.user_repository = user_repository
        self.friendship_repository = friendship_repository
        self.split_repository = split_repository
        self.notification_service = notification_service
        self.receipt_image_service = receipt_image_service
        self.audit_log_service = audit_log_service
        self.group_service = group_service
        self.shopping_list_matching_service = shopping_list_matching_service

    def find_friend(self, username: str, creator: User, group: StoredGroup | None) -> StoredUser:
        stored_user = self.user_repository.find_by_username(username)
        if stored_user is None:
            raise BadRequestError(f"No account with username '{username}'")
        is_group_member = group is not None and stored_user.id in group.member_ids
        if not is_group_member and not self.friendship_repository.are_friends(creator.id, stored_user.id):
            raise BadRequestError(f"'{username}' isn't in your friends list")
        return stored_user

    def find_friends_assigned(
        self, assignments: dict[str, list[str]], creator: User, group: StoredGroup | None
    ) -> dict[str, StoredUser]:
        assigned_usernames = {normalize_username(name) for names in assignments.values() for name in names}
        return {
            username: self.find_friend(username, creator, group)
            for username in assigned_usernames
            if username != creator.username
        }

    def find_payer(self, split_request: SplitRequest, creator: User, group: StoredGroup | None) -> User:
        payer_username = normalize_username(split_request.payer_username or creator.username)
        if payer_username == creator.username:
            return creator
        return convert_to_user(self.find_friend(payer_username, creator, group))

    def find_group(self, split_request: SplitRequest, creator: User) -> StoredGroup | None:
        if not split_request.group_id:
            return None
        return self.group_service.get_group_for_member(split_request.group_id, creator.id)

    def calculate_split(
        self, split_request: SplitRequest, creator: User
    ) -> tuple[SplitResult, User, dict[str, StoredUser], StoredGroup | None]:
        group = self.find_group(split_request, creator)
        payer = self.find_payer(split_request, creator, group)
        friends_by_username = self.find_friends_assigned(split_request.assignments, creator, group)
        split_result = split_receipt(split_request.receipt, split_request.assignments, payer.username)
        split_result = apply_upfront_payments(split_result, split_request.paid_in_full, split_request.paid_amounts)
        return split_result, payer, friends_by_username, group

    def preview_split(self, split_request: SplitRequest, creator: User) -> SplitResult:
        split_result, _, _, _ = self.calculate_split(split_request, creator)
        return split_result

    def save_split(self, split_request: SplitRequest, creator: User) -> SavedSplit:
        split_result, payer, friends_by_username, group = self.calculate_split(split_request, creator)
        if all(person.owes == 0 and person.paid == 0 for person in split_result.people):
            raise BadRequestError("Nobody owes anything on this receipt")
        receipt_image_id = split_request.receipt.receipt_image_id
        if receipt_image_id:
            self.receipt_image_service.ensure_owned_by(receipt_image_id, creator.id)
        user_ids_by_username = {username: friend.id for username, friend in friends_by_username.items()}
        user_ids_by_username[creator.username] = creator.id
        user_ids_by_username[payer.username] = payer.id
        saved_split = self.split_repository.create(
            payer.id,
            split_result,
            user_ids_by_username,
            split_request.receipt.store_name,
            split_request.receipt.store_address,
            split_request.receipt.purchase_date,
            receipt_image_id,
            creator,
            group,
        )
        self.record_saved_split(saved_split, creator, payer, user_ids_by_username)
        crossed_off_items = (
            self.shopping_list_matching_service.cross_off_for_split(group, split_request, saved_split, creator)
            if group
            else []
        )
        emailed_usernames = self.notification_service.notify_people_who_owe(saved_split, payer, friends_by_username)
        return saved_split.model_copy(
            update={"emailed_usernames": emailed_usernames, "crossed_off_items": crossed_off_items}
        )

    def record_saved_split(
        self, saved_split: SavedSplit, creator: User, payer: User, user_ids_by_username: dict[str, str]
    ) -> None:
        self.audit_log_service.record(
            creator.id,
            "splits",
            "saved_split",
            describe_saved_split(saved_split.store_name, saved_split.total),
            creator.username,
        )
        if payer.id != creator.id:
            self.audit_log_service.record(
                payer.id,
                "splits",
                "recorded_as_payer",
                describe_recorded_as_payer(creator.username, saved_split.store_name, saved_split.total),
                creator.username,
                notify=True,
            )
        for person in saved_split.people:
            if person.username in (payer.username, creator.username):
                continue
            self.audit_log_service.record(
                user_ids_by_username[person.username],
                "splits",
                "added_to_split",
                describe_added_to_split(creator.username, saved_split.store_name, person.owes, payer.username),
                creator.username,
                notify=True,
            )

    def list_splits(self, user_id: str) -> list[SavedSplit]:
        return self.split_repository.list_for_user(user_id)
