import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from test_group_split import ApiTester, clear_test_database  # noqa: E402

ALICE, BOB = "alice_test", "bob_test"
RECEIPTS = [
    ("Walmart", [("GV LG EGGS 18CT", 4.97), ("GV 2% MLK GAL", 3.48), ("BNNA", 1.50)]),
    ("Aldi", [("Large Eggs 18 ct", 3.77), ("2% Milk Gallon", 2.89)]),
    ("Walmart", [("GV LG EGGS 18CT", 5.12), ("GV 2% MLK GAL", 3.48)]),
]


def log_receipts(tester: ApiTester, group_id: str) -> None:
    for store_name, items in RECEIPTS:
        receipt_items = [
            {"id": f"item_{position}", "name": name, "total_price": price}
            for position, (name, price) in enumerate(items, start=1)
        ]
        tester.request(
            "POST",
            "/api/splits",
            ALICE,
            {
                "receipt": {"store_name": store_name, "items": receipt_items},
                "assignments": {item["id"]: [ALICE, BOB] for item in receipt_items},
                "group_id": group_id,
                "shopping_list_matches": {},
            },
            201,
        )


def run_insights_test(tester: ApiTester) -> None:
    for username in (ALICE, BOB):
        tester.sign_up(username)
    tester.request("POST", "/api/friends", ALICE, {"username": BOB}, 201)
    group = tester.request("POST", "/api/groups", ALICE, {"name": "Apartment", "member_usernames": [BOB]}, 201)
    log_receipts(tester, group["id"])

    price_watch = tester.request("GET", "/api/insights/prices", ALICE)
    for comparison in price_watch["comparisons"]:
        print(f"      {comparison['product']}: {comparison['tip'] or 'no cheaper store yet'}")
    egg_comparison = next((item for item in price_watch["comparisons"] if "egg" in item["product"]), None)
    tester.check("eggs from both stores are grouped as one product", egg_comparison is not None and egg_comparison["purchase_count"] == 3)
    tester.check("cheapest eggs were at Aldi", egg_comparison is not None and egg_comparison["cheapest_store"] == "Aldi")
    tester.check("tip says how much cheaper", egg_comparison is not None and egg_comparison["savings"] == 1.35)

    year = datetime.now(timezone.utc).year
    recap = tester.request("GET", f"/api/insights/recap?year={year}&group_id={group['id']}", BOB)
    print(f"      headline: {recap['headline']}")
    tester.check("recap counts the group's runs", recap["grocery_runs"] == 3 and recap["scope_name"] == "Apartment")
    tester.check("recap totals the receipts", recap["total_spent"] == 25.21)
    tester.check("top store is Walmart", recap["top_stores"][0]["store"] == "Walmart")
    tester.check("shopping buddy is Alice", (recap["shopping_buddy"] or {}).get("name") == "Alice")
    tester.check("top product was bought three times", recap["top_products"][0]["count"] == 3)
    members = {member["username"]: member for member in recap["members"]}
    tester.check("group recap has every member", set(members) == {ALICE, BOB})
    tester.check("Alice paid for all three runs", members[ALICE]["runs_paid"] == 3 and members[BOB]["runs_paid"] == 0)
    tester.check("shares add up to the receipts", round(members[ALICE]["share"] + members[BOB]["share"], 2) == 25.21)
    personal_recap = tester.request("GET", f"/api/insights/recap?year={year}", BOB)
    tester.check("personal recap has no member list", personal_recap["members"] == [])


def main() -> int:
    clear_test_database()
    tester = ApiTester()
    try:
        run_insights_test(tester)
    finally:
        clear_test_database()
    print(f"\n{len(tester.failures)} failed")
    return 1 if tester.failures else 0


if __name__ == "__main__":
    sys.exit(main())
