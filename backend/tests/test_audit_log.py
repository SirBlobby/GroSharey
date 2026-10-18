"""Every feature that changes an account should leave an entry in that account's audit log."""

import base64
from datetime import datetime, timedelta, timezone
from io import BytesIO

import mongomock
import pytest
from PIL import Image

import server.dependencies as dependencies
from server.main import app
from server.maintenance.backfill_audit_log import backfill_audit_log

MILK_SPLIT = {
    "receipt": {
        "store_name": "Costco",
        "items": [
            {"id": "item_1", "name": "Milk", "total_price": 6.00},
            {"id": "item_2", "name": "Bread", "total_price": 4.00},
        ],
    },
    "assignments": {"item_1": ["alex", "sachi"], "item_2": ["sachi"]},
}


def clear_dependency_caches():
    for name in dir(dependencies):
        dependency = getattr(dependencies, name)
        if callable(dependency) and hasattr(dependency, "cache_clear"):
            dependency.cache_clear()


@pytest.fixture
def fake_database(monkeypatch):
    database = mongomock.MongoClient()["grosharey_test"]
    monkeypatch.setattr(dependencies, "get_database", lambda: database)
    clear_dependency_caches()
    yield database
    clear_dependency_caches()


@pytest.fixture
def client(fake_database):
    return app.test_client()


def sign_up(client, username: str) -> dict:
    response = client.post(
        "/api/auth/signup",
        json={
            "email": f"{username}@example.com",
            "username": username,
            "display_name": username.title(),
            "password": "password123",
        },
    )
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json['access_token']}"}


def audit_descriptions(client, headers) -> list[str]:
    response = client.get("/api/audit-log", headers=headers)
    assert response.status_code == 200
    return [audit_event["description"] for audit_event in response.json["events"]]


def build_png_base64() -> str:
    image_buffer = BytesIO()
    Image.new("RGB", (8, 8), "green").save(image_buffer, format="PNG")
    return base64.b64encode(image_buffer.getvalue()).decode("ascii")


def test_audit_log_requires_log_in(client):
    assert client.get("/api/audit-log").status_code == 401


def test_sign_up_log_in_and_log_out_are_logged(client):
    sachi = sign_up(client, "sachi")
    client.post("/api/auth/login", json={"email": "sachi@example.com", "password": "wrong-password"})
    client.post("/api/auth/login", json={"email": "sachi@example.com", "password": "password123"})
    assert client.post("/api/auth/logout", headers=sachi).status_code == 204

    assert audit_descriptions(client, sachi) == [
        "Logged out",
        "Logged in",
        "Someone tried to log in with a wrong password",
        "Created your account",
    ]


def test_adding_and_removing_a_friend_is_logged_for_both_people(client):
    sachi = sign_up(client, "sachi")
    alex = sign_up(client, "alex")

    assert client.post("/api/friends", json={"username": "alex"}, headers=sachi).status_code == 201
    assert client.delete("/api/friends/alex", headers=sachi).status_code == 204

    sachi_log = audit_descriptions(client, sachi)
    assert sachi_log[:2] == ["You removed @alex as a friend", "You added @alex as a friend"]
    alex_log = audit_descriptions(client, alex)
    assert alex_log[:2] == ["@sachi removed you as a friend", "@sachi added you as a friend"]


def test_profile_changes_are_logged(client):
    sachi = sign_up(client, "sachi")

    picture_response = client.put(
        "/api/profiles/me/picture", json={"image_base64": build_png_base64()}, headers=sachi
    )
    assert picture_response.status_code == 200
    handles_response = client.put(
        "/api/profiles/me/payment-handles", json={"venmo_username": "sachi-v"}, headers=sachi
    )
    assert handles_response.status_code == 200

    assert audit_descriptions(client, sachi)[:2] == [
        "Updated your payment links",
        "Changed your profile picture",
    ]


def test_splits_and_payments_are_logged_for_everyone_involved(client):
    sachi = sign_up(client, "sachi")
    alex = sign_up(client, "alex")
    client.post("/api/friends", json={"username": "alex"}, headers=sachi)

    assert client.post("/api/splits", json=MILK_SPLIT, headers=sachi).status_code == 201
    payment_response = client.post(
        "/api/payments",
        json={"friend_username": "sachi", "amount": 3.00, "direction": "paid", "method": "venmo"},
        headers=alex,
    )
    assert payment_response.status_code == 201

    sachi_log = audit_descriptions(client, sachi)
    assert sachi_log[:2] == [
        "@alex recorded a $3.00 payment from @alex to @sachi",
        "Saved a split for Costco totaling $10.00",
    ]
    alex_log = audit_descriptions(client, alex)
    assert alex_log[:2] == [
        "You recorded a $3.00 payment from @alex to @sachi",
        "@sachi added you to a split for Costco, you owe $3.00",
    ]


def test_each_person_only_sees_their_own_audit_log(client):
    sachi = sign_up(client, "sachi")
    sam = sign_up(client, "sam")
    client.put("/api/profiles/me/payment-handles", json={"venmo_username": "sachi-v"}, headers=sachi)

    assert audit_descriptions(client, sam) == ["Created your account"]


def test_backfill_adds_history_from_before_the_audit_log_once(client, fake_database):
    sachi = sign_up(client, "sachi")
    sign_up(client, "alex")
    users_by_username = {user["username"]: str(user["_id"]) for user in fake_database["users"].find()}
    long_ago = datetime.now(timezone.utc) - timedelta(days=30)
    fake_database["friendships"].insert_one(
        {
            "pair_key": ":".join(sorted(users_by_username.values())),
            "user_ids": sorted(users_by_username.values()),
            "created_at": long_ago,
        }
    )
    fake_database["audit_events"].update_many({}, {"$set": {"created_at": long_ago + timedelta(days=1)}})

    assert backfill_audit_log(fake_database) == 2
    assert backfill_audit_log(fake_database) == 0
    assert "You and @alex became friends" in audit_descriptions(client, sachi)


def test_audit_log_is_paginated_and_filtered_by_category(client):
    sachi = sign_up(client, "sachi")
    for venmo_username in ("first", "second", "third"):
        client.put("/api/profiles/me/payment-handles", json={"venmo_username": venmo_username}, headers=sachi)

    first_page = client.get("/api/audit-log?page=1&page_size=2", headers=sachi).json
    assert first_page["total"] == 4
    assert len(first_page["events"]) == 2
    last_page = client.get("/api/audit-log?page=2&page_size=2", headers=sachi).json
    assert [event["description"] for event in last_page["events"]] == [
        "Updated your payment links",
        "Created your account",
    ]

    account_page = client.get("/api/audit-log?category=account", headers=sachi).json
    assert account_page["total"] == 1
    assert client.get("/api/audit-log?page=0", headers=sachi).status_code == 400


def test_notifications_only_show_what_other_people_did(client):
    sachi = sign_up(client, "sachi")
    alex = sign_up(client, "alex")
    client.post("/api/friends", json={"username": "alex"}, headers=sachi)
    client.post("/api/splits", json=MILK_SPLIT, headers=sachi)

    alex_notifications = client.get("/api/notifications", headers=alex).json
    assert [notification["description"] for notification in alex_notifications["notifications"]] == [
        "@sachi added you to a split for Costco, you owe $3.00",
        "@sachi added you as a friend",
    ]
    assert alex_notifications["unread_count"] == 2
    assert client.get("/api/notifications", headers=sachi).json["total"] == 0


def test_notifications_can_be_marked_read(client):
    sachi = sign_up(client, "sachi")
    alex = sign_up(client, "alex")
    client.post("/api/friends", json={"username": "alex"}, headers=sachi)
    client.post("/api/splits", json=MILK_SPLIT, headers=sachi)
    newest_notification = client.get("/api/notifications", headers=alex).json["notifications"][0]

    response = client.post(
        "/api/notifications/read", json={"notification_ids": [newest_notification["id"]]}, headers=alex
    )
    assert response.status_code == 204
    assert client.get("/api/notifications", headers=alex).json["unread_count"] == 1

    client.post("/api/notifications/read", json={}, headers=alex)
    alex_notifications = client.get("/api/notifications", headers=alex).json
    assert alex_notifications["unread_count"] == 0
    assert all(notification["is_read"] for notification in alex_notifications["notifications"])


def test_failed_log_in_creates_a_notification(client):
    sachi = sign_up(client, "sachi")
    client.post("/api/auth/login", json={"email": "sachi@example.com", "password": "wrong-password"})

    sachi_notifications = client.get("/api/notifications", headers=sachi).json
    assert sachi_notifications["notifications"][0]["description"] == "Someone tried to log in with a wrong password"
