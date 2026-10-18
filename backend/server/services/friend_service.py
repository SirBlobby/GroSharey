from datetime import datetime
from urllib.parse import quote, urlencode

from server.errors import BadRequestError, NotFoundError
from server.models.friend_models import Friend
from server.models.split_models import SavedSplit
from server.models.user_models import StoredUser
from server.repositories.friendship_repository import FriendshipRepository
from server.repositories.payment_repository import PaymentRepository
from server.repositories.split_repository import SplitRepository
from server.repositories.user_repository import UserRepository
from server.services.audit_log_service import AuditLogService
from server.services.user_mapper import convert_to_public_profile

DEFAULT_PAYMENT_NOTE = "groSharey groceries"
MAX_SPLITS_IN_PAYMENT_NOTE = 3


def describe_split_date(split: SavedSplit) -> str:
    split_date = split.created_at
    if split.purchase_date:
        try:
            split_date = datetime.strptime(split.purchase_date, "%Y-%m-%d")
        except ValueError:
            pass
    return f"{split_date:%b} {split_date.day}"


def build_payment_note(unpaid_splits: list[SavedSplit], unpaid_split_count: int) -> str:
    if not unpaid_splits:
        return DEFAULT_PAYMENT_NOTE
    split_descriptions = [
        f"{split.store_name or 'Groceries'} {describe_split_date(split)}" for split in unpaid_splits
    ]
    remaining_count = unpaid_split_count - len(unpaid_splits)
    if remaining_count > 0:
        split_descriptions.append(f"and {remaining_count} more")
    return f"{DEFAULT_PAYMENT_NOTE}: {', '.join(split_descriptions)}"


def build_venmo_pay_url(venmo_username: str, amount: float, note: str) -> str:
    query = urlencode({"txn": "pay", "amount": f"{amount:.2f}", "note": note})
    return f"https://venmo.com/{quote(venmo_username)}?{query}"


def build_paypal_pay_url(paypal_username: str, amount: float) -> str:
    return f"https://paypal.me/{quote(paypal_username)}/{amount:.2f}"


class FriendService:
    def __init__(
        self,
        user_repository: UserRepository,
        friendship_repository: FriendshipRepository,
        split_repository: SplitRepository,
        payment_repository: PaymentRepository,
        audit_log_service: AuditLogService,
    ):
        self.user_repository = user_repository
        self.audit_log_service = audit_log_service
        self.friendship_repository = friendship_repository
        self.split_repository = split_repository
        self.payment_repository = payment_repository

    def find_user_by_username(self, username: str) -> StoredUser:
        stored_user = self.user_repository.find_by_username(username)
        if stored_user is None:
            raise NotFoundError("User", username)
        return stored_user

    def calculate_balances_in_cents(self, user_id: str) -> dict[str, int]:
        """other user id -> cents they owe user_id (negative when user_id owes them).

        Summed from saved splits and payments every time, never stored."""
        balances: dict[str, int] = {}
        additions_and_subtractions = (
            (self.split_repository.sum_owed_to_payer(user_id), 1),
            (self.split_repository.sum_owed_by_user(user_id), -1),
            (self.payment_repository.sum_paid_to_user(user_id), -1),
            (self.payment_repository.sum_paid_by_user(user_id), 1),
        )
        for cents_by_user_id, sign in additions_and_subtractions:
            for other_user_id, cents in cents_by_user_id.items():
                if other_user_id != user_id:
                    balances[other_user_id] = balances.get(other_user_id, 0) + sign * cents
        return balances

    def get_balance_in_cents(self, user_id: str, friend_id: str) -> int:
        return self.calculate_balances_in_cents(user_id).get(friend_id, 0)

    def build_friends(self, user_id: str, friend_users: list[StoredUser]) -> list[Friend]:
        balances = self.calculate_balances_in_cents(user_id)
        friends = []
        for friend_user in friend_users:
            balance = balances.get(friend_user.id, 0) / 100
            amount_you_owe = -balance if balance < 0 else 0
            friends.append(
                Friend(
                    **convert_to_public_profile(friend_user).model_dump(),
                    balance=balance,
                    venmo_username=friend_user.venmo_username,
                    paypal_username=friend_user.paypal_username,
                    venmo_pay_url=(
                        build_venmo_pay_url(
                            friend_user.venmo_username, amount_you_owe, self.build_note_for(friend_user.id, user_id)
                        )
                        if amount_you_owe and friend_user.venmo_username
                        else None
                    ),
                    paypal_pay_url=(
                        build_paypal_pay_url(friend_user.paypal_username, amount_you_owe)
                        if amount_you_owe and friend_user.paypal_username
                        else None
                    ),
                )
            )
        return sorted(friends, key=lambda friend: friend.display_name.lower())

    def build_note_for(self, payer_id: str, debtor_id: str) -> str:
        unpaid_splits, unpaid_split_count = self.split_repository.list_unpaid_splits(
            payer_id, debtor_id, MAX_SPLITS_IN_PAYMENT_NOTE
        )
        return build_payment_note(unpaid_splits, unpaid_split_count)

    def list_friends(self, user_id: str) -> list[Friend]:
        friend_users = self.user_repository.find_by_ids(self.friendship_repository.list_friend_ids(user_id))
        return self.build_friends(user_id, friend_users)

    def add_friend(self, user_id: str, username_or_email: str) -> Friend:
        friend_user = self.user_repository.find_by_username_or_email(username_or_email)
        if friend_user is None:
            raise NotFoundError("User", username_or_email)
        if friend_user.id == user_id:
            raise BadRequestError("You can't add yourself as a friend")
        self.friendship_repository.add(user_id, friend_user.id)
        self.record_friendship_change(user_id, friend_user, "added_friend", "added")
        return self.build_friends(user_id, [friend_user])[0]

    def remove_friend(self, user_id: str, username: str) -> None:
        friend_user = self.find_user_by_username(username)
        self.friendship_repository.remove(user_id, friend_user.id)
        self.record_friendship_change(user_id, friend_user, "removed_friend", "removed")

    def record_friendship_change(self, user_id: str, friend_user: StoredUser, action: str, verb: str) -> None:
        current_user = self.user_repository.find_by_id(user_id)
        current_username = current_user.username if current_user else None
        self.audit_log_service.record(
            user_id, "friends", action, f"You {verb} @{friend_user.username} as a friend", current_username
        )
        self.audit_log_service.record(
            friend_user.id,
            "friends",
            action,
            f"@{current_username} {verb} you as a friend",
            current_username,
            notify=True,
        )
