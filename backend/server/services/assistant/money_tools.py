from server.errors import BadRequestError
from server.models.dispute_models import CreateDisputeRequest
from server.models.friend_models import Friend
from server.models.payment_models import RecordPaymentRequest
from server.models.split_models import SavedSplit
from server.services.assistant.assistant_context import AssistantContext
from server.services.assistant.list_tools import declare
from server.services.assistant.name_matching import names_match, needs_confirmation, person_matches, pick_one

PERSON = {"type": "string", "description": "A friend's name or username"}
RECENT_SPLIT_LIMIT = 8

MONEY_TOOL_DECLARATIONS = [
    declare(
        "get_balances",
        "Gets how much each friend owes the speaker or the speaker owes them, after confirmed payments.",
        {},
    ),
    declare(
        "get_recent_splits",
        "Gets recent grocery runs: store, date, total, who paid, and each person's share. Can filter to one friend.",
        {"person": PERSON},
    ),
    declare(
        "get_pending_payments",
        "Gets payments waiting for confirmation: ones the speaker needs to confirm and ones they're waiting on.",
        {},
    ),
    declare(
        "confirm_payment",
        "Confirms the speaker got a payment a friend said they sent.",
        {"person": PERSON, "amount": {"type": "number", "description": "Only needed if there are several"}},
        ["person"],
    ),
    declare(
        "record_payment",
        "Records money changing hands with a friend. Needs the speaker's confirmation first.",
        {
            "person": PERSON,
            "amount": {"type": "number"},
            "direction": {
                "type": "string",
                "enum": ["speaker_paid", "friend_paid"],
                "description": "speaker_paid when the speaker paid the friend, friend_paid when the friend paid them",
            },
            "confirmed": {"type": "boolean"},
        },
        ["person", "amount", "direction"],
    ),
    declare(
        "dispute_split_item",
        "Flags an item on a recent split that the speaker says they didn't get, so whoever made the split can fix it.",
        {
            "item_name": {"type": "string"},
            "store_name": {"type": "string", "description": "Store of the split, if the speaker said it"},
            "reason": {"type": "string"},
        },
        ["item_name"],
    ),
    declare(
        "remind_friends_to_pay",
        "Sends a reminder and email to friends who owe the speaker money. Leave person empty to remind everyone.",
        {"person": PERSON},
    ),
    declare("list_friends", "Lists the speaker's friends.", {}),
    declare(
        "add_friend",
        "Adds a friend by their exact username or email.",
        {"username_or_email": {"type": "string"}},
        ["username_or_email"],
    ),
]


def describe_balance(friend: Friend) -> str:
    if friend.balance > 0:
        return f"{friend.display_name} owes the speaker ${friend.balance:.2f}"
    if friend.balance < 0:
        return f"The speaker owes {friend.display_name} ${-friend.balance:.2f}"
    return f"The speaker and {friend.display_name} are settled up"


class MoneyTools:
    def __init__(self, context: AssistantContext):
        self.context = context
        self.user = context.user
        self.friend_service = context.services.friend_service
        self.payment_service = context.services.payment_service
        self.split_service = context.services.split_service

    def find_friend(self, person: str) -> Friend:
        friends = self.friend_service.list_friends(self.user.id)
        matches = [friend for friend in friends if person_matches(person, friend.username, friend.display_name)]
        return pick_one(matches, person, "friend", [friend.display_name for friend in friends])

    def describe_split(self, split: SavedSplit) -> dict:
        return {
            "store": split.store_name or "Grocery run",
            "date": split.purchase_date or f"{split.created_at:%Y-%m-%d}",
            "total": split.total,
            "paid_by": "the speaker" if split.payer == self.user.username else split.payer,
            "group": split.group_name,
            "shares": [
                {
                    "person": "the speaker" if person.username == self.user.username else person.username,
                    "total": person.total,
                    "still_owes": person.owes,
                    "items": [item.name for item in person.items],
                }
                for person in split.people
            ],
        }

    def get_balances(self) -> dict:
        friends = self.friend_service.list_friends(self.user.id)
        balances = [{"friend": friend.display_name, "summary": describe_balance(friend)} for friend in friends]
        return {"balances": balances}

    def get_recent_splits(self, person: str = "") -> dict:
        splits = self.split_service.list_splits(self.user.id)
        if person.strip():
            friend = self.find_friend(person)
            splits = [
                split
                for split in splits
                if split.payer == friend.username or any(share.username == friend.username for share in split.people)
            ]
        return {"splits": [self.describe_split(split) for split in splits[:RECENT_SPLIT_LIMIT]]}

    def get_pending_payments(self) -> dict:
        pending_payments = self.payment_service.list_pending_payments(self.user.id)
        return {
            "to_confirm": [
                f"{payment.from_username} says they paid the speaker ${payment.amount:.2f}"
                for payment in pending_payments
                if payment.to_username == self.user.username
            ],
            "waiting_on_friends": [
                f"Waiting for {payment.to_username} to confirm ${payment.amount:.2f} the speaker paid"
                for payment in pending_payments
                if payment.from_username == self.user.username
            ],
        }

    def confirm_payment(self, person: str, amount: float = 0) -> dict:
        friend = self.find_friend(person)
        incoming_payments = [
            payment
            for payment in self.payment_service.list_pending_payments(self.user.id)
            if payment.from_username == friend.username and payment.to_username == self.user.username
        ]
        if amount:
            incoming_payments = [payment for payment in incoming_payments if abs(payment.amount - amount) < 0.01]
        if not incoming_payments:
            raise BadRequestError(f"There's no payment from {friend.display_name} waiting to be confirmed")
        if len(incoming_payments) > 1:
            amounts = ", ".join(f"${payment.amount:.2f}" for payment in incoming_payments)
            raise BadRequestError(f"{friend.display_name} has several pending payments ({amounts}). Ask which amount.")
        confirmed_payment = self.payment_service.confirm_payment(incoming_payments[0].id, self.user)
        self.context.changed_data = True
        return {"confirmed": f"${confirmed_payment.amount:.2f} from {friend.display_name}"}

    def record_payment(self, person: str, amount: float, direction: str, confirmed: bool = False) -> dict:
        friend = self.find_friend(person)
        speaker_paid = direction == "speaker_paid"
        action = (
            f"record that the speaker paid {friend.display_name} ${amount:.2f}"
            if speaker_paid
            else f"record that {friend.display_name} paid the speaker ${amount:.2f}"
        )
        if not confirmed:
            return needs_confirmation(action)
        payment_request = RecordPaymentRequest(
            friend_username=friend.username, amount=amount, direction="paid" if speaker_paid else "received"
        )
        payment = self.payment_service.record_payment(self.user, payment_request)
        self.context.changed_data = True
        waiting_note = f" It waits for {friend.display_name} to confirm." if payment.status == "pending" else ""
        return {"recorded": f"{action.removeprefix('record that ')}.{waiting_note}"}

    def dispute_split_item(self, item_name: str, store_name: str = "", reason: str = "") -> dict:
        splits = self.split_service.list_splits(self.user.id)
        for split in splits:
            if store_name.strip() and not names_match(store_name, split.store_name):
                continue
            your_share = next((share for share in split.people if share.username == self.user.username), None)
            item_share = next(
                (item for item in (your_share.items if your_share else []) if names_match(item_name, item.name)),
                None,
            )
            if item_share and split.payer != self.user.username:
                self.context.services.split_dispute_service.dispute_item(
                    split.id, CreateDisputeRequest(item_id=item_share.item_id, reason=reason or None), self.user
                )
                self.context.changed_data = True
                return {"disputed": item_share.name, "split": split.store_name or "Grocery run", "maker_notified": True}
        raise BadRequestError(f"Couldn't find {item_name} on the speaker's share of a recent split someone else paid")

    def remind_friends_to_pay(self, person: str = "") -> dict:
        usernames = [self.find_friend(person).username] if person.strip() else None
        reminder_result = self.context.services.payment_reminder_service.remind(self.user, usernames)
        return {
            "reminded": reminder_result.reminded,
            "already_reminded_in_the_last_24_hours": {
                username: f"can be reminded again after {next_time:%Y-%m-%d %H:%M} UTC"
                for username, next_time in reminder_result.next_reminder_times.items()
            },
        }

    def list_friends(self) -> dict:
        friends = self.friend_service.list_friends(self.user.id)
        return {"friends": [{"name": friend.display_name, "username": friend.username} for friend in friends]}

    def add_friend(self, username_or_email: str) -> dict:
        added_friend = self.friend_service.add_friend(self.user.id, username_or_email)
        self.context.changed_data = True
        return {"added": added_friend.display_name, "username": added_friend.username}
