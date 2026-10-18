"""Choosing who paid at the store, and recording what people already paid when the split is saved."""

import mongomock
import pytest

import server.dependencies as dependencies
from server.main import app

GROCERIES = {
    "store_name": "Costco",
    "items": [
        {"id": "item_1", "name": "Milk", "total_price": 6.00},
        {"id": "item_2", "name": "Bread", "total_price": 4.00},
        {"id": "item_3", "name": "Eggs", "total_price": 8.00},
    ],
}
ASSIGNMENTS = {"item_1": ["sachi"], "item_2": ["alex"], "item_3": ["sam"]}


def clear_dependency_caches():
    for name in dir(dependencies):
        dependency = getattr(dependencies, name)
        if callable(dependency) and hasattr(dependency, "cache_clear"):
            dependency.cache_clear()


@pytest.fixture
def client(monkeypatch):
    fake_database = mongomock.MongoClient()["grosharey_test"]
    monkeypatch.setattr(dependencies, "get_database", lambda: fake_database)
    clear_dependency_caches()
    yield app.test_client()
    clear_dependency_caches()


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
    return {"Authorization": f"Bearer {response.json['access_token']}"}


def balances(client, headers) -> dict[str, float]:
    return {friend["username"]: friend["balance"] for friend in client.get("/api/friends", headers=headers).json}


@pytest.fixture
def roommates(client):
    sachi = sign_up(client, "sachi")
    alex = sign_up(client, "alex")
    sam = sign_up(client, "sam")
    client.post("/api/friends", json={"username": "alex"}, headers=sachi)
    client.post("/api/friends", json={"username": "sam"}, headers=sachi)
    return sachi, alex, sam


def test_creator_pays_by_default_and_owes_nothing(client, roommates):
    sachi, _, _ = roommates
    saved = client.post("/api/splits", json={"receipt": GROCERIES, "assignments": ASSIGNMENTS}, headers=sachi)
    assert saved.status_code == 201
    assert saved.json["payer"] == "sachi"
    assert saved.json["created_by"] == "sachi"
    assert balances(client, sachi) == {"alex": 4.00, "sam": 8.00}


def test_a_friend_can_be_the_payer(client, roommates):
    sachi, alex, _ = roommates
    body = {"receipt": GROCERIES, "assignments": ASSIGNMENTS, "payer_username": "alex"}
    saved = client.post("/api/splits", json=body, headers=sachi)
    assert saved.status_code == 201
    assert saved.json["payer"] == "alex"

    assert balances(client, sachi)["alex"] == -6.00
    assert balances(client, alex)["sachi"] == 6.00
    alex_notifications = client.get("/api/notifications", headers=alex).json["notifications"]
    assert alex_notifications[0]["description"] == "@sachi recorded that you paid $18.00 for Costco"


def test_payer_must_be_a_friend(client, roommates):
    sachi, _, _ = roommates
    sign_up(client, "stranger")
    body = {"receipt": GROCERIES, "assignments": ASSIGNMENTS, "payer_username": "stranger"}
    response = client.post("/api/splits", json=body, headers=sachi)
    assert response.status_code == 400
    assert "friends list" in response.json["detail"]


def test_people_can_be_marked_paid_in_full_or_partly(client, roommates):
    sachi, _, _ = roommates
    body = {
        "receipt": GROCERIES,
        "assignments": ASSIGNMENTS,
        "paid_in_full": ["alex"],
        "paid_amounts": {"sam": 5.00},
    }
    saved = client.post("/api/splits", json=body, headers=sachi)
    assert saved.status_code == 201
    people = {person["username"]: person for person in saved.json["people"]}
    assert (people["alex"]["paid"], people["alex"]["owes"]) == (4.00, 0)
    assert (people["sam"]["paid"], people["sam"]["owes"]) == (5.00, 3.00)
    assert balances(client, sachi) == {"alex": 0, "sam": 3.00}


def test_overpaying_upfront_leaves_a_credit(client, roommates):
    sachi, alex, _ = roommates
    body = {"receipt": GROCERIES, "assignments": ASSIGNMENTS, "paid_amounts": {"alex": 9.00}}
    saved = client.post("/api/splits", json=body, headers=sachi)
    assert saved.status_code == 201
    alex_share = next(person for person in saved.json["people"] if person["username"] == "alex")
    assert (alex_share["paid"], alex_share["owes"]) == (9.00, -5.00)
    assert balances(client, sachi)["alex"] == -5.00
    alex_notifications = client.get("/api/notifications", headers=alex).json["notifications"]
    assert alex_notifications[0]["description"] == (
        "@sachi added you to a split for Costco, you overpaid and are owed $5.00 back"
    )
