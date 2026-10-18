"""Emails sent when a split is saved. A fake SMTP server records messages instead of sending."""

import dataclasses
import smtplib

import mongomock
import pytest

import server.dependencies as dependencies
import server.services.email_service as email_service_module
from server.main import app


class FakeSmtpServer:
    sent_messages: list = []
    fail_on_connect = False

    def __init__(self, host, port, timeout):
        if FakeSmtpServer.fail_on_connect:
            raise OSError("connection refused")
        self.host = host

    def __enter__(self):
        return self

    def __exit__(self, *exception_info):
        return False

    def starttls(self):
        pass

    def login(self, username, password):
        assert password == "abcdabcdabcdabcd"

    def send_message(self, message):
        FakeSmtpServer.sent_messages.append(message)


def clear_dependency_caches():
    for name in dir(dependencies):
        dependency = getattr(dependencies, name)
        if callable(dependency) and hasattr(dependency, "cache_clear"):
            dependency.cache_clear()


def build_client(monkeypatch, email_configured: bool):
    fake_database = mongomock.MongoClient()["grosharey_test"]
    monkeypatch.setattr(dependencies, "get_database", lambda: fake_database)
    test_settings = dataclasses.replace(
        dependencies.settings,
        email_sender_address="grosharey.app@gmail.com" if email_configured else "",
        email_app_password="abcdabcdabcdabcd" if email_configured else "",
        app_url="https://grosharey.example",
    )
    monkeypatch.setattr(dependencies, "settings", test_settings)
    monkeypatch.setattr(email_service_module.smtplib, "SMTP", FakeSmtpServer)
    FakeSmtpServer.sent_messages = []
    FakeSmtpServer.fail_on_connect = False
    clear_dependency_caches()
    return app.test_client()


@pytest.fixture(autouse=True)
def reset_caches_after_test():
    yield
    clear_dependency_caches()


def sign_up(client, username: str, display_name: str | None = None) -> dict:
    response = client.post(
        "/api/auth/signup",
        json={
            "email": f"{username}@example.com",
            "username": username,
            "display_name": display_name or username.title(),
            "password": "password123",
        },
    )
    return {"Authorization": f"Bearer {response.json['access_token']}"}


def save_milk_split(client, sachi) -> object:
    return client.post(
        "/api/splits",
        json={
            "receipt": {
                "store_name": "Costco",
                "items": [
                    {"id": "item_1", "name": "Milk", "total_price": 6.00},
                    {"id": "item_2", "name": "Bread", "total_price": 4.00},
                ],
            },
            "assignments": {"item_1": ["alex", "sachi"], "item_2": ["sachi"]},
        },
        headers=sachi,
    )


def test_people_who_owe_get_an_email(monkeypatch):
    client = build_client(monkeypatch, email_configured=True)
    sachi = sign_up(client, "sachi", display_name="Sachi <b>V</b>")
    sign_up(client, "alex")
    client.post("/api/friends", json={"username": "alex"}, headers=sachi)

    response = save_milk_split(client, sachi)
    assert response.status_code == 201
    assert response.json["emailed_usernames"] == ["alex"]

    assert len(FakeSmtpServer.sent_messages) == 1  # Sachi paid, so only Alex is emailed
    message = FakeSmtpServer.sent_messages[0]
    assert message["To"] == "alex@example.com"
    assert message["Subject"] == "You owe Sachi <b>V</b> $3.00. Pay Sachi <b>V</b> in GroSharey"
    text_body = message.get_body(("plain",)).get_content()
    html_body = message.get_body(("html",)).get_content()
    assert "Milk: $3.00" in text_body
    assert "at Costco" in text_body
    assert "https://grosharey.example/?user=sachi" in text_body
    assert "<b>V</b>" not in html_body  # names are escaped in the HTML version
    assert "&lt;b&gt;V&lt;/b&gt;" in html_body


def test_split_is_saved_even_without_email_setup(monkeypatch):
    client = build_client(monkeypatch, email_configured=False)
    sachi = sign_up(client, "sachi")
    sign_up(client, "alex")
    client.post("/api/friends", json={"username": "alex"}, headers=sachi)

    response = save_milk_split(client, sachi)
    assert response.status_code == 201
    assert response.json["emailed_usernames"] == []
    assert FakeSmtpServer.sent_messages == []


def test_split_is_saved_when_email_server_is_down(monkeypatch):
    client = build_client(monkeypatch, email_configured=True)
    FakeSmtpServer.fail_on_connect = True
    sachi = sign_up(client, "sachi")
    sign_up(client, "alex")
    client.post("/api/friends", json={"username": "alex"}, headers=sachi)

    response = save_milk_split(client, sachi)
    assert response.status_code == 201
    assert response.json["emailed_usernames"] == []
    assert len(client.get("/api/splits", headers=sachi).json) == 1


def make_alex_owe_sachi(client) -> tuple[dict, dict]:
    sachi = sign_up(client, "sachi")
    alex = sign_up(client, "alex")
    client.post("/api/friends", json={"username": "alex"}, headers=sachi)
    save_milk_split(client, sachi)  # Alex owes Sachi $3.00
    FakeSmtpServer.sent_messages = []
    return sachi, alex


def test_person_who_got_paid_gets_an_email(monkeypatch):
    client = build_client(monkeypatch, email_configured=True)
    sachi, alex = make_alex_owe_sachi(client)

    response = client.post(
        "/api/payments",
        json={"friend_username": "sachi", "amount": 1.00, "direction": "paid", "method": "venmo"},
        headers=alex,
    )
    assert response.status_code == 201
    assert response.json["recipient_emailed"] is True

    assert len(FakeSmtpServer.sent_messages) == 1
    message = FakeSmtpServer.sent_messages[0]
    assert message["To"] == "sachi@example.com"
    assert message["Subject"] == "Alex paid you $1.00"
    text_body = message.get_body(("plain",)).get_content()
    assert "by Venmo" in text_body
    assert "Alex still owes you $2.00." in text_body
    assert "https://grosharey.example/?user=alex" in text_body

    client.post(
        "/api/payments",
        json={"friend_username": "sachi", "amount": 2.00, "direction": "paid", "method": "cash"},
        headers=alex,
    )
    assert "all settled up" in FakeSmtpServer.sent_messages[1].get_body(("plain",)).get_content()


def test_no_email_when_the_recipient_records_it_themselves(monkeypatch):
    client = build_client(monkeypatch, email_configured=True)
    sachi, alex = make_alex_owe_sachi(client)

    response = client.post(
        "/api/payments",
        json={"friend_username": "alex", "amount": 3.00, "direction": "received", "method": "cash"},
        headers=sachi,
    )
    assert response.status_code == 201
    assert response.json["recipient_emailed"] is False
    assert FakeSmtpServer.sent_messages == []
