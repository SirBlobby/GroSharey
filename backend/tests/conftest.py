import pytest

import server.services.email_service as email_service_module


class BlockedSmtpServer:
    def __init__(self, *args, **kwargs):
        raise OSError("Tests never send real email")


@pytest.fixture(autouse=True)
def block_real_email(monkeypatch):
    """Even if backend/.env has a real Gmail app password, tests can't send email.
    Tests that check emails swap in their own fake server."""
    monkeypatch.setattr(email_service_module.smtplib, "SMTP", BlockedSmtpServer)
