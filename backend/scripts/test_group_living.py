import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from test_group_split import ApiTester, clear_test_database  # noqa: E402

ALICE, BOB, CAROL = "alice_test", "bob_test", "carol_test"
RECEIPT_ITEMS = [
    {"id": "item_1", "name": "Whole Milk", "total_price": 4.00},
    {"id": "item_2", "name": "Bananas", "total_price": 2.00},
]


def set_up_group(tester: ApiTester) -> tuple[dict, dict]:
    for username in (ALICE, BOB, CAROL):
        tester.sign_up(username)
    tester.request("POST", "/api/friends", ALICE, {"username": BOB}, 201)
    tester.request("POST", "/api/friends", ALICE, {"username": CAROL}, 201)
    group = tester.request(
        "POST",
        "/api/groups",
        ALICE,
        {"name": "Apartment", "member_usernames": [BOB, CAROL], "monthly_budget": 5},
        201,
    )
    shopping_list = tester.request("POST", "/api/shopping-lists", ALICE, {"name": "Weekly", "group_id": group["id"]}, 201)
    return group, shopping_list


def test_trip_and_budget(tester: ApiTester, group: dict, shopping_list: dict) -> dict:
    trip_group = tester.request("POST", f"/api/groups/{group['id']}/trip", ALICE, {"store": "Trader Joe's"}, 201)
    tester.check("trip shows who is shopping", (trip_group["active_trip"] or {}).get("shopper_username") == ALICE)
    bob_notifications = tester.request("GET", "/api/notifications", BOB)["notifications"]
    tester.check("group is told about the trip", any("is going to Trader Joe's" in n["description"] for n in bob_notifications))

    for requester, name in ((BOB, "milk"), (CAROL, "bananas")):
        tester.request(
            "POST", f"/api/shopping-lists/{shopping_list['id']}/items", ALICE, {"name": name, "requested_by": requester}, 201
        )
    split = tester.request(
        "POST",
        "/api/splits",
        ALICE,
        {
            "receipt": {"store_name": "Trader Joe's", "items": RECEIPT_ITEMS, "tax": None, "tip": None},
            "assignments": {"item_1": [BOB], "item_2": [CAROL]},
            "group_id": group["id"],
            "shopping_list_matches": None,
        },
        201,
    )
    groups = tester.request("GET", "/api/groups", ALICE)
    tester.check("trip ends after the shopper logs a split", groups[0]["active_trip"] is None)
    tester.check("budget counts this month's group spending", groups[0]["month_spent"] == 6.0)
    alice_notifications = tester.request("GET", "/api/notifications", CAROL)["notifications"]
    tester.check("members get a budget alert", any("monthly grocery budget" in n["description"] for n in alice_notifications))
    return split


def test_pantry(tester: ApiTester, shopping_list: dict) -> None:
    current_list = tester.request("GET", "/api/shopping-lists", BOB)[0]
    pantry_names = sorted(item["name"] for item in current_list["pantry"])
    tester.check("bought items are stocked in the pantry", pantry_names == ["bananas", "milk"])
    milk = next(item for item in current_list["pantry"] if item["name"] == "milk")
    current_list = tester.request(
        "POST", f"/api/shopping-lists/{shopping_list['id']}/pantry/{milk['id']}/running-low", BOB
    )
    open_names = [item["name"] for item in current_list["items"] if not item["is_crossed_off"]]
    tester.check("running low puts the item back on the list", open_names == ["milk"])
    milk_again = next(item for item in current_list["items"] if not item["is_crossed_off"])
    tester.check("the re-added item keeps who asked for it", milk_again["requested_by"] == BOB)
    current_list = tester.request("DELETE", f"/api/shopping-lists/{shopping_list['id']}/pantry/{milk['id']}", BOB)
    tester.check("used up items leave the pantry", [item["name"] for item in current_list["pantry"]] == ["bananas"])


def test_dispute(tester: ApiTester, split: dict) -> None:
    disputed = tester.request("POST", f"/api/splits/{split['id']}/disputes", BOB, {"item_id": "item_1", "reason": "Wasn't in the bag"}, 201)
    tester.check("dispute is saved on the split", disputed["disputes"][0]["status"] == "open")
    alice_notifications = tester.request("GET", "/api/notifications", ALICE)["notifications"]
    tester.check("split maker is told about the dispute", any("didn't get Whole Milk" in n["description"] for n in alice_notifications))
    tester.request("PATCH", f"/api/splits/{split['id']}/disputes/{disputed['disputes'][0]['id']}", BOB, {"resolution": "removed"}, 400)
    resolved = tester.request("PATCH", f"/api/splits/{split['id']}/disputes/{disputed['disputes'][0]['id']}", ALICE, {"resolution": "removed"})
    bob_share = next(person for person in resolved["people"] if person["username"] == BOB)
    tester.check("removing the item takes it off their share", bob_share["owes"] == 0 and bob_share["items"] == [])
    bob_balance = next(friend for friend in tester.request("GET", "/api/friends", ALICE) if friend["username"] == BOB)
    tester.check("balance drops after the item is removed", bob_balance["balance"] == 0)


def test_payment_confirmation(tester: ApiTester) -> None:
    payment = tester.request("POST", "/api/payments", CAROL, {"friend_username": ALICE, "amount": 2, "direction": "paid"}, 201)
    tester.check("a payment the payer records starts pending", payment["status"] == "pending")
    carol_balance = next(friend for friend in tester.request("GET", "/api/friends", ALICE) if friend["username"] == CAROL)
    tester.check("pending payments don't change the balance", carol_balance["balance"] == 2)
    pending = tester.request("GET", "/api/payments/pending", ALICE)
    tester.check("the person who got paid sees it waiting", [item["id"] for item in pending] == [payment["id"]])
    tester.request("POST", f"/api/payments/{payment['id']}/confirm", CAROL, {}, 404)
    tester.request("POST", f"/api/payments/{payment['id']}/confirm", ALICE, {})
    carol_balance = next(friend for friend in tester.request("GET", "/api/friends", ALICE) if friend["username"] == CAROL)
    tester.check("confirming the payment settles the balance", carol_balance["balance"] == 0)


def test_pdf_export(tester: ApiTester) -> None:
    month = f"{datetime.now(timezone.utc):%Y-%m}"
    response = tester.client.get(
        f"/api/splits/report.pdf?month={month}", headers={"Authorization": f"Bearer {tester.tokens[ALICE]}"}
    )
    tester.check("pdf report downloads", response.status_code == 200 and response.data.startswith(b"%PDF"))
    tester.check("pdf report is a real file", len(response.data) > 1000)


def main() -> int:
    clear_test_database()
    tester = ApiTester()
    try:
        group, shopping_list = set_up_group(tester)
        split = test_trip_and_budget(tester, group, shopping_list)
        test_pantry(tester, shopping_list)
        test_dispute(tester, split)
        test_payment_confirmation(tester)
        test_pdf_export(tester)
    finally:
        clear_test_database()
    print(f"\n{len(tester.failures)} failed")
    return 1 if tester.failures else 0


if __name__ == "__main__":
    sys.exit(main())
