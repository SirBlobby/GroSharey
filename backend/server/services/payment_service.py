from server.errors import BadRequestError
from server.models.payment_models import Payment, RecordPaymentRequest
from server.models.user_models import User
from server.repositories.friendship_repository import FriendshipRepository
from server.repositories.payment_repository import PaymentRepository
from server.services.audit_log_service import AuditLogService
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
        friend_owes_you_cents = self.friend_service.get_balance_in_cents(current_user.id, friend_user.id)
        if payment_request.direction == "received":
            payer, recipient, payer_owes_cents = friend_user, current_user, friend_owes_you_cents
        else:
            payer, recipient, payer_owes_cents = current_user, friend_user, -friend_owes_you_cents

        # Paying more than is owed is almost always a typo, so it's rejected.
        if amount_cents > max(payer_owes_cents, 0):
            raise BadRequestError(
                f"{payer.username} only owes {recipient.username} ${max(payer_owes_cents, 0) / 100:.2f}"
            )

        payment = self.payment_repository.create(payer, recipient, amount_cents, payment_request.method, current_user)
        payment_summary = f"${amount_cents / 100:.2f} payment from @{payer.username} to @{recipient.username}"
        self.audit_log_service.record(
            current_user.id, "payments", "recorded_payment", f"You recorded a {payment_summary}", current_user.username
        )
        self.audit_log_service.record(
            friend_user.id,
            "payments",
            "recorded_payment",
            f"@{current_user.username} recorded a {payment_summary}",
            current_user.username,
        )
        # Email the person who got paid, unless they recorded it themselves.
        if payment_request.direction == "paid":
            still_owed_cents = self.friend_service.get_balance_in_cents(friend_user.id, current_user.id)
            recipient_emailed = self.notification_service.notify_payment_received(
                current_user, friend_user, amount_cents, payment_request.method, still_owed_cents
            )
            payment = payment.model_copy(update={"recipient_emailed": recipient_emailed})
        return payment

    def list_payments(self, user_id: str) -> list[Payment]:
        return self.payment_repository.list_for_user(user_id)
