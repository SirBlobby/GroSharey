import logging
import smtplib
from dataclasses import dataclass
from email.message import EmailMessage

logger = logging.getLogger(__name__)

SMTP_TIMEOUT_SECONDS = 10


@dataclass(frozen=True)
class InlineImage:
    content_id: str
    data: bytes
    subtype: str = "png"


@dataclass(frozen=True)
class OutgoingEmail:
    to_address: str
    subject: str
    text_body: str
    html_body: str
    inline_images: tuple[InlineImage, ...] = ()


class EmailService:
    """Sends email through an SMTP server (Gmail by default) using an app password."""

    def __init__(self, sender_address: str, app_password: str, smtp_host: str, smtp_port: int):
        self.sender_address = sender_address
        self.app_password = app_password
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port

    def is_configured(self) -> bool:
        return bool(self.sender_address and self.app_password)

    def send_all(self, outgoing_emails: list[OutgoingEmail]) -> list[str]:
        """Sends each email over one connection. Returns the addresses that were sent to.

        Failures are logged, not raised: a saved split shouldn't fail because email did."""
        if not outgoing_emails:
            return []
        if not self.is_configured():
            logger.warning("Email isn't configured (EMAIL_SENDER_ADDRESS / EMAIL_APP_PASSWORD); skipping")
            return []

        sent_addresses = []
        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=SMTP_TIMEOUT_SECONDS) as smtp_connection:
                smtp_connection.starttls()
                smtp_connection.login(self.sender_address, self.app_password)
                for outgoing_email in outgoing_emails:
                    try:
                        smtp_connection.send_message(self.build_message(outgoing_email))
                        sent_addresses.append(outgoing_email.to_address)
                    except smtplib.SMTPException:
                        logger.exception("Couldn't send email to %s", outgoing_email.to_address)
        except (smtplib.SMTPException, OSError):
            logger.exception("Couldn't connect to the email server")
        return sent_addresses

    def build_message(self, outgoing_email: OutgoingEmail) -> EmailMessage:
        message = EmailMessage()
        message["From"] = f"GroSharey <{self.sender_address}>"
        message["To"] = outgoing_email.to_address
        message["Subject"] = outgoing_email.subject
        message.set_content(outgoing_email.text_body)
        message.add_alternative(outgoing_email.html_body, subtype="html")
        html_part = message.get_payload()[-1]
        for inline_image in outgoing_email.inline_images:
            html_part.add_related(
                inline_image.data,
                maintype="image",
                subtype=inline_image.subtype,
                cid=f"<{inline_image.content_id}>",
                disposition="inline",
                filename=f"{inline_image.content_id}.{inline_image.subtype}",
            )
        return message
