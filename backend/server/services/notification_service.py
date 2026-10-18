from html import escape
from urllib.parse import urlencode

from server.models.split_models import PersonSplit, SavedSplit
from server.models.user_models import StoredUser, User
from server.services.email_service import EmailService, OutgoingEmail


def format_money(amount: float) -> str:
    return f"${amount:,.2f}"


class NotificationService:
    def __init__(self, email_service: EmailService, app_url: str):
        self.email_service = email_service
        self.app_url = app_url.rstrip("/")

    def build_payer_link(self, payer: User) -> str:
        # Opens the payer's profile in the web app, after logging in if needed.
        return f"{self.app_url}/?{urlencode({'user': payer.username})}"

    def build_split_email(
        self, saved_split: SavedSplit, payer: User, person: PersonSplit, recipient: StoredUser
    ) -> OutgoingEmail:
        store_text = f" at {saved_split.store_name}" if saved_split.store_name else ""
        payer_link = self.build_payer_link(payer)
        item_lines = [f"{item.name}: {format_money(item.total)}" for item in person.items]
        extras = []
        if person.tip:
            extras.append(f"Tip share: {format_money(person.tip)}")

        text_body = "\n".join(
            [
                f"Hi {recipient.display_name},",
                "",
                f"{payer.display_name} bought groceries{store_text} and split them with you.",
                "",
                *item_lines,
                *extras,
                "",
                f"You owe {payer.display_name} {format_money(person.owes)}.",
                f"Pay or see details: {payer_link}",
            ]
        )

        html_items = "".join(f"<li>{escape(line)}</li>" for line in item_lines + extras)
        html_body = (
            f"<p>Hi {escape(recipient.display_name)},</p>"
            f"<p>{escape(payer.display_name)} bought groceries{escape(store_text)} and split them with you.</p>"
            f"<ul>{html_items}</ul>"
            f"<p><strong>You owe {escape(payer.display_name)} {format_money(person.owes)}.</strong></p>"
            f'<p><a href="{escape(payer_link)}">Pay {escape(payer.display_name)} in GroSharey</a></p>'
        )
        return OutgoingEmail(
            to_address=recipient.email,
            subject=f"You owe {payer.display_name} {format_money(person.owes)} for groceries",
            text_body=text_body,
            html_body=html_body,
        )

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
