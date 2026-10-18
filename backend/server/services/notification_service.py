from server.models.payment_models import PaymentMethod
from server.models.split_models import PersonSplit, SavedSplit
from server.models.user_models import StoredUser, User
from server.services.email_service import EmailService, OutgoingEmail
from server.services.email_templates import (
    INFO_BLUE,
    EmailContent,
    EmailLine,
    read_logo_image,
    render_email,
    render_text,
)

PAYMENT_METHOD_LABELS = {"venmo": "Venmo", "paypal": "PayPal", "cash": "cash"}


def format_money(amount: float) -> str:
    return f"${amount:,.2f}"


class NotificationService:
    def __init__(self, email_service: EmailService, app_url: str):
        self.email_service = email_service
        self.app_url = app_url.rstrip("/")

    def build_email(self, to_address: str, subject: str, email_content: EmailContent) -> OutgoingEmail:
        return OutgoingEmail(
            to_address=to_address,
            subject=subject,
            text_body=render_text(email_content),
            html_body=render_email(email_content, self.app_url),
            inline_images=(read_logo_image(),),
        )

    def build_split_email(
        self, saved_split: SavedSplit, payer: User, person: PersonSplit, recipient: StoredUser
    ) -> OutgoingEmail:
        store_text = f" at {saved_split.store_name}" if saved_split.store_name else ""
        lines = [EmailLine(item.name, format_money(item.total)) for item in person.items]
        if person.tip:
            lines.append(EmailLine("Tip share", format_money(person.tip)))
        if person.paid:
            lines.append(EmailLine("You already paid", f"-{format_money(person.paid)}"))
        owed = format_money(person.owes)
        email_content = EmailContent(
            preview_text=f"Your share of the groceries{store_text} is {owed}.",
            greeting=f"Hi {recipient.display_name},",
            heading=f"{payer.display_name} split a grocery run with you",
            paragraphs=[f"{payer.display_name} bought groceries{store_text}. Here's your part."],
            amount_label=f"You owe {payer.display_name}",
            amount=owed,
            lines=lines,
            button_label=f"Pay {payer.display_name}",
            button_url=self.app_url,
            footnote="Something wrong? Open the split in groSharey and tap \"I didn't get this\" on the item.",
        )
        return self.build_email(recipient.email, f"You owe {payer.display_name} {owed} for groceries", email_content)

    def notify_people_who_owe(
        self, saved_split: SavedSplit, payer: User, users_by_username: dict[str, StoredUser]
    ) -> list[str]:
        """Emails everyone who owes the payer on this split. Returns the usernames emailed."""
        people_who_owe = [person for person in saved_split.people if person.owes > 0]
        outgoing_emails = [
            self.build_split_email(saved_split, payer, person, users_by_username[person.username])
            for person in people_who_owe
            if person.username in users_by_username
        ]
        sent_addresses = set(self.email_service.send_all(outgoing_emails))
        return [
            person.username
            for person in people_who_owe
            if person.username in users_by_username and users_by_username[person.username].email in sent_addresses
        ]

    def build_reminder_email(
        self, creditor: User, debtor: StoredUser, amount_owed: float, pay_url: str | None
    ) -> OutgoingEmail:
        amount = format_money(amount_owed)
        email_content = EmailContent(
            preview_text=f"Friendly reminder: you owe {creditor.display_name} {amount}.",
            greeting=f"Hi {debtor.display_name},",
            heading=f"A friendly nudge from {creditor.display_name}",
            paragraphs=[f"{creditor.display_name} sent a reminder about the groceries you still owe them for."],
            amount_label=f"You owe {creditor.display_name}",
            amount=amount,
            button_label=f"Pay {creditor.display_name}" if pay_url else "See what you owe",
            button_url=pay_url or self.app_url,
            footnote="Already paid? Record it in groSharey so they can confirm it.",
        )
        return self.build_email(debtor.email, f"Reminder: you owe {creditor.display_name} {amount}", email_content)

    def send_payment_reminders(
        self, creditor: User, reminders: list[tuple[StoredUser, float, str | None]]
    ) -> list[str]:
        outgoing_emails = [
            self.build_reminder_email(creditor, debtor, amount_owed, pay_url)
            for debtor, amount_owed, pay_url in reminders
        ]
        emailed_addresses = set(self.email_service.send_all(outgoing_emails))
        return [debtor.username for debtor, _, _ in reminders if debtor.email in emailed_addresses]

    def build_payment_email(
        self, payer: User, recipient: StoredUser, amount_cents: int, method: PaymentMethod, still_owed_cents: int
    ) -> OutgoingEmail:
        amount = format_money(amount_cents / 100)
        method_text = f" by {PAYMENT_METHOD_LABELS[method]}" if method in PAYMENT_METHOD_LABELS else ""
        if still_owed_cents > 0:
            still_owed = format_money(still_owed_cents / 100)
            balance_text = f"After you confirm, {payer.display_name} will still owe you {still_owed}."
        else:
            balance_text = f"After you confirm, you and {payer.display_name} are all settled up."
        email_content = EmailContent(
            preview_text=f"{payer.display_name} says they paid you {amount}. Confirm it when you get it.",
            greeting=f"Hi {recipient.display_name},",
            heading=f"{payer.display_name} says they paid you",
            paragraphs=[
                f"{payer.display_name} marked a payment to you{method_text}. Confirm it once the money shows up.",
                balance_text,
            ],
            amount_label="Payment",
            amount=amount,
            amount_color=INFO_BLUE,
            button_label="Confirm the payment",
            button_url=self.app_url,
            footnote=f"Didn't get it? Check with {payer.display_name} before you confirm.",
        )
        return self.build_email(recipient.email, f"{payer.display_name} paid you {amount}", email_content)

    def notify_payment_received(
        self,
        payer: User,
        recipient: StoredUser,
        amount_cents: int,
        method: PaymentMethod,
        still_owed_cents: int,
    ) -> bool:
        """Emails the person who got paid. Returns whether the email went out."""
        outgoing_email = self.build_payment_email(payer, recipient, amount_cents, method, still_owed_cents)
        return recipient.email in self.email_service.send_all([outgoing_email])
