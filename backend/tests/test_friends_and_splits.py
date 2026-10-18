"""End-to-end API tests against an in-memory fake MongoDB (mongomock), so the real
database is never touched."""

import mongomock
import pytest

import server.dependencies as dependencies
from server.main import app

COSTCO_RECEIPT = {
    "store_name": "Costco Wholesale",
    "items": [
        {"id": "item_1", "name": "Ice Cream", "total_price": 13.99, "tax_code": "E"},
        {"id": "item_2", "name": "Hamburger Rolls", "total_price": 3.79, "tax_code": "E"},
        {"id": "item_3", "name": "Chicken Potstickers", "total_price": 8.79, "tax_code": "E"},
    ],
    "tax": 0.27,
}


@pytest.fixture
def client(monkeypatch):
    fake_database = mongomock.MongoClient()["grosharey_test"]
    monkeypatch.setattr(dependencies, "get_database", lambda: fake_database)
    for dependency in (
        dependencies.get_user_repository,
        dependencies.get_auth_service,
        dependencies.get_profile_service,
        dependencies.get_friendship_repository,
        dependencies.get_split_repository,
        dependencies.get_friend_service,
        dependencies.get_split_service,
        dependencies.get_payment_repository,
        dependencies.get_payment_service,
    ):
        dependency.cache_clear()
    yield app.test_client()
    for dependency in (dependencies.get_user_repository, dependencies.get_auth_service):
        dependency.cache_clear()


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


def friends_by_username(client, headers) -> dict:
    return {friend["username"]: friend for friend in client.get("/api/friends", headers=headers).json}


def test_adding_a_friend_is_mutual(client):
    sachi = sign_up(client, "sachi")
    alex = sign_up(client, "alex")

    response = client.post("/api/friends", json={"username": "Alex"}, headers=sachi)
    assert response.status_code == 201
    assert response.json["username"] == "alex"
    assert response.json["balance"] == 0

    assert list(friends_by_username(client, sachi)) == ["alex"]
    assert list(friends_by_username(client, alex)) == ["sachi"]


def test_cannot_add_yourself_or_unknown_user(client):
    sachi = sign_up(client, "sachi")
    assert client.post("/api/friends", json={"username": "sachi"}, headers=sachi).status_code == 400
    assert client.post("/api/friends", json={"username": "nobody"}, headers=sachi).status_code == 404


def test_split_rejects_people_who_are_not_friends(client):
    sachi = sign_up(client, "sachi")
    sign_up(client, "stranger")
    body = {
        "receipt": COSTCO_RECEIPT,
        "assignments": {"item_1": ["stranger"], "item_2": ["sachi"], "item_3": ["sachi"]},
    }
    response = client.post("/api/splits", json=body, headers=sachi)
    assert response.status_code == 400
    assert "friends list" in response.json["detail"]

    body["assignments"]["item_1"] = ["alxe"]
    response = client.post("/api/splits", json=body, headers=sachi)
    assert response.status_code == 400
    assert "No account" in response.json["detail"]


def test_saved_split_updates_balances_for_both_sides(client):
    sachi = sign_up(client, "sachi")
    alex = sign_up(client, "alex")
    sam = sign_up(client, "sam")
    client.post("/api/friends", json={"username": "alex"}, headers=sachi)
    client.post("/api/friends", json={"username": "sam"}, headers=sachi)

    body = {
        "receipt": COSTCO_RECEIPT,
        "assignments": {"item_1": ["alex", "sam"], "item_2": ["sachi"], "item_3": ["sachi"]},
    }
    preview = client.post("/api/receipts/split", json=body, headers=sachi)
    assert preview.status_code == 200
    assert client.get("/api/splits", headers=sachi).json == []  # preview saves nothing

    saved = client.post("/api/splits", json=body, headers=sachi)
    assert saved.status_code == 201
    assert saved.json["store_name"] == "Costco Wholesale"

    sachi_friends = friends_by_username(client, sachi)
    assert sorted([sachi_friends["alex"]["balance"], sachi_friends["sam"]["balance"]]) == [7.06, 7.07]
    alex_balance_with_sachi = friends_by_username(client, alex)["sachi"]["balance"]
    assert alex_balance_with_sachi in (-7.06, -7.07)

    # Alex pays next time: balances net out instead of piling up separately.
    client.post(
        "/api/splits",
        json={
            "receipt": {"items": [{"id": "item_1", "name": "Milk", "total_price": 5.00}]},
            "assignments": {"item_1": ["sachi"]},
        },
        headers=alex,
    )
    assert friends_by_username(client, alex)["sachi"]["balance"] == pytest.approx(alex_balance_with_sachi + 5.00)

    assert len(client.get("/api/splits", headers=sachi).json) == 2
    assert len(client.get("/api/splits", headers=sam).json) == 1


def test_saving_a_split_where_nobody_owes_is_rejected(client):
    sachi = sign_up(client, "sachi")
    body = {
        "receipt": {"items": [{"id": "item_1", "name": "Milk", "total_price": 5.00}]},
        "assignments": {"item_1": ["sachi"]},
    }
    assert client.post("/api/splits", json=body, headers=sachi).status_code == 400


def test_removing_a_friend(client):
    sachi = sign_up(client, "sachi")
    sign_up(client, "alex")
    client.post("/api/friends", json={"username": "alex"}, headers=sachi)
    assert client.delete("/api/friends/alex", headers=sachi).status_code == 204
    assert client.get("/api/friends", headers=sachi).json == []


def owe_sachi_for_ice_cream(client) -> tuple[dict, dict]:
    """Sachi pays for a $10 item that Alex owes her for."""
    sachi = sign_up(client, "sachi")
    alex = sign_up(client, "alex")
    client.post("/api/friends", json={"username": "alex"}, headers=sachi)
    client.post(
        "/api/splits",
        json={
            "receipt": {"items": [{"id": "item_1", "name": "Ice Cream", "total_price": 10.00}]},
            "assignments": {"item_1": ["alex"]},
        },
        headers=sachi,
    )
    return sachi, alex


def test_payment_lowers_balance_for_both_sides(client):
    sachi, alex = owe_sachi_for_ice_cream(client)

    response = client.post(
        "/api/payments",
        json={"friend_username": "sachi", "amount": 4.00, "direction": "paid", "method": "venmo"},
        headers=alex,
    )
    assert response.status_code == 201
    assert response.json["from_username"] == "alex"
    assert response.json["to_username"] == "sachi"
    assert friends_by_username(client, sachi)["alex"]["balance"] == 6.00
    assert friends_by_username(client, alex)["sachi"]["balance"] == -6.00

    # Sachi records the rest from her side.
    client.post(
        "/api/payments",
        json={"friend_username": "alex", "amount": 6.00, "direction": "received", "method": "cash"},
        headers=sachi,
    )
    assert friends_by_username(client, sachi)["alex"]["balance"] == 0
    assert len(client.get("/api/payments", headers=alex).json) == 2


def test_overpaying_is_rejected(client):
    sachi, alex = owe_sachi_for_ice_cream(client)
    response = client.post(
        "/api/payments", json={"friend_username": "sachi", "amount": 10.01, "direction": "paid"}, headers=alex
    )
    assert response.status_code == 400
    assert "only owes" in response.json["detail"]
    # Sachi doesn't owe Alex anything, so she can't "pay" him.
    response = client.post(
        "/api/payments", json={"friend_username": "alex", "amount": 1.00, "direction": "paid"}, headers=sachi
    )
    assert response.status_code == 400


def test_pay_links_appear_only_for_the_person_who_owes(client):
    sachi, alex = owe_sachi_for_ice_cream(client)
    response = client.put(
        "/api/profiles/me/payment-handles",
        json={"venmo_username": "@sachi-v", "paypal_username": "sachiv"},
        headers=sachi,
    )
    assert response.status_code == 200
    assert response.json["venmo_username"] == "sachi-v"

    sachi_for_alex = friends_by_username(client, alex)["sachi"]
    assert sachi_for_alex["venmo_pay_url"] == (
        "https://venmo.com/sachi-v?txn=pay&amount=10.00&note=GroSharey+groceries"
    )
    assert sachi_for_alex["paypal_pay_url"] == "https://paypal.me/sachiv/10.00"
    # Alex owes Sachi, not the other way round, so Sachi sees no pay links for Alex.
    assert friends_by_username(client, sachi)["alex"]["venmo_pay_url"] is None


def test_invalid_payment_handle_is_rejected(client):
    sachi = sign_up(client, "sachi")
    response = client.put(
        "/api/profiles/me/payment-handles", json={"venmo_username": "not valid!"}, headers=sachi
    )
    assert response.status_code == 400
