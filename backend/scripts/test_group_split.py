import os
import sys
from pathlib import Path

TEST_DATABASE_NAME = "grosharey_genai_test"
os.environ["MONGODB_DATABASE_NAME"] = TEST_DATABASE_NAME
os.environ["EMAIL_SENDER_ADDRESS"] = ""

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from server.database import get_database  # noqa: E402
from server.main import app  # noqa: E402

USERNAMES = ["alice_test", "bob_test", "carol_test"]
REQUESTED_ITEMS = [("alice_test", "milk"), ("bob_test", "bananas"), ("carol_test", "eggs"), ("bob_test", "eggs")]
RECEIPT_ITEMS = [
    {"id": "item_1", "name": "GV 2% MLK GAL", "total_price": 3.48},
    {"id": "item_2", "name": "ORG BNNA", "total_price": 1.20},
    {"id": "item_3", "name": "LG EGGS 18CT", "total_price": 5.97},
    {"id": "item_4", "name": "DORITOS NACHO", "total_price": 4.50},
]


class ApiTester:
    def __init__(self):
        self.client = app.test_client()
        self.tokens: dict[str, str] = {}
        self.failures: list[str] = []

    def request(self, method: str, path: str, username: str, body: dict | None = None, expected_status: int = 200):
        response = self.client.open(
            path, method=method, json=body, headers={"Authorization": f"Bearer {self.tokens[username]}"}
        )
        if response.status_code != expected_status:
            raise RuntimeError(f"{method} {path} returned {response.status_code}: {response.get_json()}")
        return response.get_json()

    def sign_up(self, username: str) -> None:
        response = self.client.post(
            "/api/auth/signup",
            json={
                "email": f"{username}@example.com",
                "username": username,
                "display_name": username.split("_")[0].title(),
                "password": "test-password-123",
            },
        )
        self.tokens[username] = response.get_json()["access_token"]

    def check(self, description: str, is_passing: bool) -> None:
        print(f"{'PASS' if is_passing else 'FAIL'}  {description}")
        if not is_passing:
            self.failures.append(description)


def build_split_request(group_id: str, matches: dict | None, assignments: dict) -> dict:
    return {
        "receipt": {"store_name": "Walmart", "items": RECEIPT_ITEMS, "tax": None, "tip": None},
        "assignments": assignments,
        "group_id": group_id,
        "shopping_list_matches": matches,
    }


def run_group_split_test(tester: ApiTester) -> None:
    alice, bob, carol = USERNAMES
    for username in USERNAMES:
        tester.sign_up(username)
    tester.request("POST", "/api/friends", alice, {"username": bob}, 201)
    tester.request("POST", "/api/friends", alice, {"username": carol}, 201)

    group = tester.request("POST", "/api/groups", alice, {"name": "Apartment 4B", "member_usernames": [bob, carol]}, 201)
    tester.check("group has three members", len(group["members"]) == 3)

    shopping_list = tester.request("POST", "/api/shopping-lists", bob, {"name": "Weekly", "group_id": group["id"]}, 201)
    for requester, item_name in REQUESTED_ITEMS:
        shopping_list = tester.request(
            "POST", f"/api/shopping-lists/{shopping_list['id']}/items", alice,
            {
                "name": item_name,
                "requested_by": requester,
                "store": "Trader Joe's" if item_name == "milk" else None,
                "notes": "the oat milk kind is fine too" if item_name == "milk" else None,
            },
            201,
        )
    tester.check("group list has four items", len(shopping_list["items"]) == 4)

    matched = tester.request(
        "POST", f"/api/groups/{group['id']}/match-items", alice,
        {"items": [{"id": item["id"], "name": item["name"]} for item in RECEIPT_ITEMS]},
    )
    print(f"      AI assignments: {matched['assignments']}")
    assignments = matched["assignments"]
    tester.check("milk assigned to alice", assignments.get("item_1") == [alice])
    tester.check("bananas assigned to bob", assignments.get("item_2") == [bob])
    tester.check("eggs assigned to carol and bob", sorted(assignments.get("item_3", [])) == sorted([carol, bob]))
    tester.check("doritos left unassigned", "item_4" not in assignments)

    split_assignments = {**assignments, "item_4": [alice]}
    saved_split = tester.request(
        "POST", "/api/splits", alice, build_split_request(group["id"], matched["matches"], split_assignments), 201
    )
    print(f"      crossed off: {saved_split['crossed_off_items']}")
    tester.check("split crossed off four list items", len(saved_split["crossed_off_items"]) == 4)
    owes_by_username = {person["username"]: person["owes"] for person in saved_split["people"]}
    tester.check("carol owes half the eggs", owes_by_username.get(carol) == 2.98 or owes_by_username.get(carol) == 2.99)

    shopping_list = tester.request("GET", "/api/shopping-lists", carol)[0]
    tester.check("crossed off items are kept on the list", len(shopping_list["items"]) == 4)
    tester.check("every list item is crossed off", all(item["is_crossed_off"] for item in shopping_list["items"]))
    milk_item = next(item for item in shopping_list["items"] if item["name"] == "milk")
    tester.check("milk keeps its store and notes", milk_item["store"] == "Trader Joe's" and bool(milk_item["notes"]))
    tester.check("milk from Trader Joe's is crossed off when bought at Walmart", milk_item["bought_at"] == "Walmart")

    tester.request(
        "POST", f"/api/shopping-lists/{shopping_list['id']}/items", bob, {"name": "bananas"}, 201
    )
    fallback_split = tester.request(
        "POST", "/api/splits", alice,
        build_split_request(group["id"], None, {"item_2": [bob]}) | {
            "receipt": {"store_name": "Aldi", "items": [RECEIPT_ITEMS[1]], "tax": None, "tip": None}
        },
        201,
    )
    print(f"      crossed off without saved matches: {fallback_split['crossed_off_items']}")
    tester.check("split matches on the server when no matches are sent", fallback_split["crossed_off_items"] == ["bananas"])

    notifications = tester.request("GET", "/api/notifications", bob)
    descriptions = [notification["description"] for notification in notifications["notifications"]]
    tester.check("bob was notified his items were bought", any("bought your" in text for text in descriptions))


def clear_test_database() -> None:
    database = get_database()
    for collection_name in database.list_collection_names():
        database[collection_name].delete_many({})


def main() -> int:
    clear_test_database()
    tester = ApiTester()
    try:
        run_group_split_test(tester)
    finally:
        clear_test_database()
    print(f"\n{len(tester.failures)} failed")
    return 1 if tester.failures else 0


if __name__ == "__main__":
    sys.exit(main())
