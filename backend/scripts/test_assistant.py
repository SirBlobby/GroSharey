import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from test_group_split import ApiTester, clear_test_database  # noqa: E402

ALICE, BOB = "alice_test", "bob_test"
RATE_LIMIT_WAIT_SECONDS = 30


def ask(tester: ApiTester, text: str, history: list[dict]) -> dict:
    body = {"text": text, "history": history, "wants_audio": False}
    response = tester.client.post(
        "/api/assistant", json=body, headers={"Authorization": f"Bearer {tester.tokens[ALICE]}"}
    )
    while response.status_code == 429:
        print(f"      rate limited, waiting {RATE_LIMIT_WAIT_SECONDS} seconds")
        time.sleep(RATE_LIMIT_WAIT_SECONDS)
        response = tester.client.post(
            "/api/assistant", json=body, headers={"Authorization": f"Bearer {tester.tokens[ALICE]}"}
        )
    reply = response.get_json()
    if response.status_code != 200:
        raise RuntimeError(f"Assistant returned {response.status_code}: {reply}")
    print(f"      you: {text}\n      assistant: {reply['reply']}")
    history.extend([{"role": "user", "text": text}, {"role": "assistant", "text": reply["reply"]}])
    return reply


def open_items(tester: ApiTester) -> list[dict]:
    shopping_list = tester.request("GET", "/api/shopping-lists", ALICE)[0]
    return [item for item in shopping_list["items"] if not item["is_crossed_off"]]


def pantry_items(tester: ApiTester) -> list[dict]:
    return tester.request("GET", "/api/shopping-lists", ALICE)[0]["pantry"]


def has_item(items: list[dict], word: str) -> bool:
    return any(word in item["name"].lower() for item in items)


def set_up(tester: ApiTester) -> None:
    for username in (ALICE, BOB):
        tester.sign_up(username)
    tester.request("POST", "/api/friends", ALICE, {"username": BOB}, 201)
    group = tester.request("POST", "/api/groups", ALICE, {"name": "Apartment", "member_usernames": [BOB]}, 201)
    tester.request("POST", "/api/shopping-lists", ALICE, {"name": "Weekly", "group_id": group["id"]}, 201)
    tester.request(
        "POST",
        "/api/splits",
        ALICE,
        {
            "receipt": {"store_name": "Aldi", "items": [{"id": "item_1", "name": "Cheese", "total_price": 6.5}]},
            "assignments": {"item_1": [BOB]},
        },
        201,
    )
    tester.request(
        "POST",
        "/api/splits",
        BOB,
        {
            "receipt": {"store_name": "Costco", "items": [{"id": "item_1", "name": "Olive Oil", "total_price": 9}]},
            "assignments": {"item_1": [ALICE]},
        },
        201,
    )
    tester.request("POST", "/api/payments", BOB, {"friend_username": ALICE, "amount": 2, "direction": "paid"}, 201)


def test_lists_and_pantry(tester: ApiTester, history: list[dict]) -> None:
    reply = ask(tester, "Add milk, coffee, and two bags of chips for Bob to the apartment list", history)
    items = {item["name"].lower(): item for item in open_items(tester)}
    tester.check("assistant reports a change", reply["changed_data"])
    tester.check("milk and coffee were added", has_item(open_items(tester), "milk") and has_item(open_items(tester), "coffee"))
    chips = next((item for name, item in items.items() if "chip" in name), None)
    tester.check("chips were added for Bob", chips is not None and chips["requested_by"] == BOB)

    ask(tester, "I just bought the coffee and the milk", history)
    still_open = [item["name"] for item in open_items(tester)]
    is_coffee_open = has_item(open_items(tester), "coffee")
    tester.check(f"coffee was crossed off (still open: {still_open})", not is_coffee_open)
    tester.check("bought items went to the pantry", has_item(pantry_items(tester), "coffee"))

    ask(tester, "We're running low on coffee", history)
    tester.check("running low puts coffee back on the list", has_item(open_items(tester), "coffee"))

    ask(tester, "Actually take the chips off the list, nobody wants them", history)
    tester.check("chips were removed", not has_item(open_items(tester), "chip"))

    ask(tester, "We used up all the milk", history)
    tester.check("milk left the pantry", not has_item(pantry_items(tester), "milk"))


def test_groups(tester: ApiTester, history: list[dict]) -> None:
    ask(tester, "Set the apartment budget to 300 dollars a month", history)
    group = tester.request("GET", "/api/groups", ALICE)[0]
    tester.check("budget was set", group["monthly_budget"] == 300)

    ask(tester, "I'm heading to Trader Joe's now", history)
    group = tester.request("GET", "/api/groups", ALICE)[0]
    tester.check("shopping trip started", (group["active_trip"] or {}).get("store", "").lower().startswith("trader"))


def test_money(tester: ApiTester, history: list[dict]) -> None:
    reply = ask(tester, "Who owes me money and how much do I owe?", history)
    tester.check("balance answer mentions Bob", "Bob" in reply["reply"])

    reply = ask(tester, "Did Bob say he paid me?", history)
    tester.check("assistant sees the pending payment", "2" in reply["reply"])
    ask(tester, "Yes, confirm Bob's payment", history)
    tester.check("payment was confirmed", tester.request("GET", "/api/payments/pending", ALICE) == [])

    reply = ask(tester, "Record that I paid Bob 9 dollars for the olive oil", history)
    tester.check("recording a payment asks first", tester.request("GET", "/api/payments/pending", ALICE) == [])
    ask(tester, "Yes", history)
    pending = tester.request("GET", "/api/payments/pending", ALICE)
    tester.check("payment is recorded after saying yes", len(pending) == 1 and pending[0]["amount"] == 9)

    ask(tester, "I never got the olive oil from the Costco run", history)
    costco = next(split for split in tester.request("GET", "/api/splits", ALICE) if split["store_name"] == "Costco")
    tester.check("olive oil was disputed", any(dispute["status"] == "open" for dispute in costco["disputes"]))


def main() -> int:
    clear_test_database()
    tester = ApiTester()
    try:
        set_up(tester)
        history: list[dict] = []
        test_lists_and_pantry(tester, history)
        test_groups(tester, history)
        test_money(tester, history)
    finally:
        clear_test_database()
    print(f"\n{len(tester.failures)} failed")
    return 1 if tester.failures else 0


if __name__ == "__main__":
    sys.exit(main())
