from server.errors import BadRequestError, NotFoundError
from server.models.payment_models import Payment, RecordPaymentRequest
from server.models.user_models import User
from server.repositories.friendship_repository import FriendshipRepository
from server.repositories.payment_repository import PaymentRepository
from server.services.audit_log_service import AuditLogService
from server.services.audit_messages import describe_payment
from server.services.friend_service import FriendService
from server.services.notification_service import NotificationService


class PaymentService:
    def __init__(
        self,
        friendship_repository: FriendshipRepository,
        payment_repository: PaymentRepository,
        friend_service: FriendService,
        audit_log_service: AuditLogService,
        notification_service: NotificationService,
    ):
        self.notification_service = notification_service
        self.friendship_repository = friendship_repository
        self.audit_log_service = audit_log_service
        self.payment_repository = payment_repository
        self.friend_service = friend_service

    def record_payment(self, current_user: User, payment_request: RecordPaymentRequest) -> Payment:
        friend_user = self.friend_service.find_user_by_username(payment_request.friend_username)
        if not self.friendship_repository.are_friends(current_user.id, friend_user.id):
            raise BadRequestError(f"'{friend_user.username}' isn't in your friends list")

        amount_cents = round(payment_request.amount * 100)
        if payment_request.direction == "received":
            payer, recipient = friend_user, current_user
        else:
            payer, recipient = current_user, friend_user

        needs_confirmation = payment_request.direction == "paid"
        payment = self.payment_repository.create(
            payer,
            recipient,
            amount_cents,
            payment_request.method,
            current_user,
            "pending" if needs_confirmation else "confirmed",
        )
        payment_summary = describe_payment(amount_cents, payer.username, recipient.username)
        if needs_confirmation:
            your_description = f"You recorded a {payment_summary}. Waiting for @{friend_user.username} to confirm."
            friend_description = (
                f"@{current_user.username} says they paid you ${amount_cents / 100:.2f}. Confirm it when you get it."
            )
        else:
            your_description = f"You recorded a {payment_summary}"
            friend_description = f"@{current_user.username} recorded a {payment_summary}"
        self.audit_log_service.record(
            current_user.id, "payments", "recorded_payment", your_description, current_user.username
        )
        self.audit_log_service.record(
            friend_user.id, "payments", "recorded_payment", friend_description, current_user.username, notify=True
        )
        # Email the person who got paid, unless they recorded it themselves.
        if payment_request.direction == "paid":
            still_owed_cents = (
                self.friend_service.get_balance_in_cents(friend_user.id, current_user.id) - amount_cents
            )
            recipient_emailed = self.notification_service.notify_payment_received(
                current_user, friend_user, amount_cents, payment_request.method, still_owed_cents
            )
            payment = payment.model_copy(update={"recipient_emailed": recipient_emailed})
        return payment

    def list_pending_payments(self, user_id: str) -> list[Payment]:
        return self.payment_repository.list_pending_for_user(user_id)

    def confirm_payment(self, payment_id: str, recipient: User) -> Payment:
        payment = self.payment_repository.find_pending_for_recipient(payment_id, recipient.id)
        user_ids = self.payment_repository.find_user_ids(payment_id) if payment else None
        if payment is None or user_ids is None:
            raise NotFoundError("Pending payment", payment_id)
        self.payment_repository.confirm(payment_id)
        payer_id, _ = user_ids
        amount_text = f"${payment.amount:.2f}"
        self.audit_log_service.record(
            recipient.id,
            "payments",
            "confirmed_payment",
            f"You confirmed @{payment.from_username}'s {amount_text} payment",
            recipient.username,
        )
        self.audit_log_service.record(
            payer_id,
            "payments",
            "payment_confirmed",
            f"@{recipient.username} confirmed your {amount_text} payment",
            recipient.username,
            notify=True,
        )
        return payment.model_copy(update={"status": "confirmed"})

    def list_payments(self, user_id: str) -> list[Payment]:
        return self.payment_repository.list_for_user(user_id)
