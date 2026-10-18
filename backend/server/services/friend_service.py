from urllib.parse import quote, urlencode

from server.errors import BadRequestError, NotFoundError
from server.models.friend_models import Friend
from server.models.user_models import StoredUser
from server.repositories.friendship_repository import FriendshipRepository
from server.repositories.payment_repository import PaymentRepository
from server.repositories.split_repository import SplitRepository
from server.repositories.user_repository import UserRepository
from server.services.audit_log_service import AuditLogService
from server.services.user_mapper import convert_to_public_profile

PAYMENT_NOTE = "GroSharey groceries"


def build_venmo_pay_url(venmo_username: str, amount: float) -> str:
    query = urlencode({"txn": "pay", "amount": f"{amount:.2f}", "note": PAYMENT_NOTE})
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
                        build_venmo_pay_url(friend_user.venmo_username, amount_you_owe)
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

    def list_friends(self, user_id: str) -> list[Friend]:
        friend_users = self.user_repository.find_by_ids(self.friendship_repository.list_friend_ids(user_id))
        return self.build_friends(user_id, friend_users)

    def add_friend(self, user_id: str, username: str) -> Friend:
        friend_user = self.find_user_by_username(username)
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
