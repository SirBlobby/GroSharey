import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from server.config import settings  # noqa: E402
from server.models.split_models import ItemShare, PersonSplit, SavedSplit  # noqa: E402
from server.models.user_models import StoredUser, User  # noqa: E402
from server.services.email_service import EmailService  # noqa: E402
from server.services.notification_service import NotificationService  # noqa: E402


def build_sample_emails(notification_service: NotificationService, to_address: str) -> list:
    now = datetime.now(timezone.utc)
    payer = User(id="1", username="sachi", display_name="Sachi", email="sachi@example.com", created_at=now)
    friend = StoredUser(
        id="2", username="mita", display_name="Mita", email=to_address, password_hash="", created_at=now
    )
    share = PersonSplit(
        username="mita",
        items=[
            ItemShare(item_id="item_1", name="Organic Bananas", price=1.2, tax=0, total=1.2),
            ItemShare(item_id="item_2", name="Whole Milk", price=3.48, tax=0.21, total=3.69),
        ],
        subtotal=4.68,
        tax=0.21,
        tip=0.5,
        total=5.39,
        owes=5.39,
    )
    split = SavedSplit(
        id="sample",
        payer="sachi",
        people=[share],
        total=26.84,
        tax_note=None,
        store_name="Costco Wholesale",
        purchase_date=f"{now:%Y-%m-%d}",
        created_at=now,
    )
    return [
        notification_service.build_split_email(split, payer, share, friend),
        notification_service.build_reminder_email(payer, friend, 8.88, None),
        notification_service.build_payment_email(payer, friend, 500, "venmo", 388),
    ]


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: uv run python scripts/send_test_emails.py <email address>", file=sys.stderr)
        return 1
    email_service = EmailService(
        settings.email_sender_address, settings.email_app_password, settings.smtp_host, settings.smtp_port
    )
    if not email_service.is_configured():
        print("Set EMAIL_SENDER_ADDRESS and EMAIL_APP_PASSWORD in backend/.env first", file=sys.stderr)
        return 1
    notification_service = NotificationService(email_service, settings.app_url)
    sample_emails = build_sample_emails(notification_service, sys.argv[1])
    sent_addresses = email_service.send_all(sample_emails)
    for sample_email in sample_emails:
        print(f"{'sent' if sample_email.to_address in sent_addresses else 'FAILED'}  {sample_email.subject}")
    return 0 if len(sent_addresses) == len(sample_emails) else 1


if __name__ == "__main__":
    sys.exit(main())
