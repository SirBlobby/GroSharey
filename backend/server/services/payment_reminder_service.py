from datetime import datetime, timedelta, timezone

from server.errors import BadRequestError
from server.models.friend_models import Friend, ReminderResult
from server.models.user_models import StoredUser, User
from server.repositories.friendship_repository import FriendshipRepository
from server.services.audit_log_service import AuditLogService
from server.services.friend_service import FriendService
from server.services.notification_service import NotificationService

REMINDER_COOLDOWN = timedelta(hours=24)


def find_next_reminder_time(last_reminder_time: datetime | None) -> datetime | None:
    if last_reminder_time is None:
        return None
    next_reminder_time = last_reminder_time + REMINDER_COOLDOWN
    return next_reminder_time if next_reminder_time > datetime.now(timezone.utc) else None


class PaymentReminderService:
    def __init__(
        self,
        friend_service: FriendService,
        friendship_repository: FriendshipRepository,
        notification_service: NotificationService,
        audit_log_service: AuditLogService,
    ):
        self.friend_service = friend_service
        self.friendship_repository = friendship_repository
        self.notification_service = notification_service
        self.audit_log_service = audit_log_service

    def find_friends_to_remind(self, user: User, usernames: list[str] | None) -> list[Friend]:
        friends_who_owe = [friend for friend in self.friend_service.list_friends(user.id) if friend.balance > 0]
        if usernames is None:
            return friends_who_owe
        wanted_usernames = {username.strip().lower().removeprefix("@") for username in usernames}
        chosen_friends = [friend for friend in friends_who_owe if friend.username in wanted_usernames]
        if not chosen_friends:
            raise BadRequestError("None of those friends owe you anything right now")
        return chosen_friends

    def remind(self, user: User, usernames: list[str] | None) -> ReminderResult:
        reminded_recently = []
        next_reminder_times = {}
        reminders: list[tuple[StoredUser, float, str | None]] = []
        friends_to_remind = self.find_friends_to_remind(user, usernames)
        your_account = self.friend_service.find_user_by_username(user.username)
        for friend in friends_to_remind:
            last_reminder_time = self.friendship_repository.find_last_reminder_time(user.id, friend.id)
            next_reminder_time = find_next_reminder_time(last_reminder_time)
            if next_reminder_time:
                reminded_recently.append(friend.username)
                next_reminder_times[friend.username] = next_reminder_time
                continue
            self.friendship_repository.save_reminder_time(user.id, friend.id)
            friend_user = self.friend_service.find_user_by_username(friend.username)
            you_as_their_friend = self.friend_service.build_friends(friend.id, [your_account])[0]
            pay_url = you_as_their_friend.venmo_pay_url or you_as_their_friend.paypal_pay_url
            reminders.append((friend_user, friend.balance, pay_url))
            self.audit_log_service.record(
                friend.id,
                "payments",
                "payment_reminder",
                f"@{user.username} sent a reminder that you owe them ${friend.balance:.2f}",
                user.username,
                notify=True,
            )
        emailed_usernames = self.notification_service.send_payment_reminders(user, reminders)
        reminded_usernames = [friend_user.username for friend_user, _, _ in reminders]
        if reminded_usernames:
            self.audit_log_service.record(
                user.id,
                "payments",
                "sent_reminders",
                f"You reminded {', '.join('@' + username for username in reminded_usernames)} to pay you",
                user.username,
            )
        return ReminderResult(
            reminded=reminded_usernames,
            reminded_recently=reminded_recently,
            next_reminder_times=next_reminder_times,
            emailed=emailed_usernames,
        )
