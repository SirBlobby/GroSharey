from collections import Counter
from datetime import datetime, timedelta, timezone

from server.models.insights_models import (
    BiggestRun,
    MemberRecap,
    PriceComparison,
    PriceWatch,
    ProductCount,
    Purchase,
    RecapQuery,
    ShoppingBuddy,
    StoreVisit,
    YearlyRecap,
)
from server.models.split_models import SavedSplit
from server.models.user_models import User
from server.repositories.split_repository import SplitRepository
from server.repositories.user_repository import UserRepository
from server.services.group_service import GroupService
from server.services.product_name_service import ProductNameService

PRICE_WATCH_DAYS = 365
TOP_LIST_SIZE = 5
UNKNOWN_STORE = "Unknown store"


def describe_split_date(split: SavedSplit) -> str:
    return split.purchase_date or f"{split.created_at:%Y-%m-%d}"


def collect_receipt_items(split: SavedSplit) -> list[tuple[str, float]]:
    prices_by_item_id: dict[str, float] = {}
    names_by_item_id: dict[str, str] = {}
    for person in split.people:
        for item_share in person.items:
            names_by_item_id.setdefault(item_share.item_id, item_share.name)
            prices_by_item_id[item_share.item_id] = prices_by_item_id.get(item_share.item_id, 0) + item_share.price
    return [(names_by_item_id[item_id], round(price, 2)) for item_id, price in prices_by_item_id.items()]


def compare_prices(product: str, purchases: list[Purchase]) -> PriceComparison:
    cheapest = min(purchases, key=lambda purchase: purchase.price)
    latest = max(purchases, key=lambda purchase: (purchase.date, purchase.logged_at))
    store_count = len({purchase.store.lower() for purchase in purchases})
    savings = round(latest.price - cheapest.price, 2)
    is_cheaper_elsewhere = savings > 0 and cheapest.store.lower() != latest.store.lower()
    tip = (
        f"{product.capitalize()} was ${savings:.2f} cheaper at {cheapest.store} than your last buy at {latest.store}"
        if is_cheaper_elsewhere
        else None
    )
    return PriceComparison(
        product=product,
        cheapest_store=cheapest.store,
        cheapest_price=cheapest.price,
        cheapest_date=cheapest.date,
        latest_store=latest.store,
        latest_price=latest.price,
        latest_date=latest.date,
        highest_price=max(purchase.price for purchase in purchases),
        purchase_count=len(purchases),
        store_count=store_count,
        savings=savings if is_cheaper_elsewhere else 0,
        tip=tip,
    )


class InsightsService:
    def __init__(
        self,
        split_repository: SplitRepository,
        user_repository: UserRepository,
        group_service: GroupService,
        product_name_service: ProductNameService,
    ):
        self.split_repository = split_repository
        self.user_repository = user_repository
        self.group_service = group_service
        self.product_name_service = product_name_service

    def collect_purchases(self, splits: list[SavedSplit]) -> list[Purchase]:
        receipt_items_by_split = [(split, collect_receipt_items(split)) for split in splits]
        raw_names = [name for _, receipt_items in receipt_items_by_split for name, _ in receipt_items]
        products_by_raw_name = self.product_name_service.find_products(raw_names)
        return [
            Purchase(
                product=products_by_raw_name.get(name, name.lower()),
                raw_name=name,
                store=split.store_name or UNKNOWN_STORE,
                price=price,
                date=describe_split_date(split),
                logged_at=split.created_at,
            )
            for split, receipt_items in receipt_items_by_split
            for name, price in receipt_items
            if price > 0
        ]

    def build_price_watch(self, user: User) -> PriceWatch:
        now = datetime.now(timezone.utc)
        splits = self.split_repository.list_for_user_between(user.id, now - timedelta(days=PRICE_WATCH_DAYS), now)
        purchases_by_product: dict[str, list[Purchase]] = {}
        for purchase in self.collect_purchases(splits):
            purchases_by_product.setdefault(purchase.product, []).append(purchase)
        comparisons = [
            compare_prices(product, purchases)
            for product, purchases in purchases_by_product.items()
            if len(purchases) >= 2
        ]
        comparisons.sort(key=lambda comparison: (-comparison.savings, -comparison.purchase_count))
        return PriceWatch(comparisons=comparisons, tracked_products=len(purchases_by_product))

    def build_recap(self, recap_query: RecapQuery, user: User) -> YearlyRecap:
        start = datetime(recap_query.year, 1, 1, tzinfo=timezone.utc)
        end = datetime(recap_query.year + 1, 1, 1, tzinfo=timezone.utc)
        splits = self.split_repository.list_for_user_between(user.id, start, end)
        scope_name = "You"
        member_recaps: list[MemberRecap] = []
        if recap_query.group_id:
            group = self.group_service.get_group(recap_query.group_id, user)
            splits = [split for split in splits if split.group_id == group.id]
            scope_name = group.name
            names_by_username = {member.username: member.display_name for member in group.members}
            member_recaps = self.build_member_recaps(splits, names_by_username)
        purchases = self.collect_purchases(splits)
        product_counts = Counter(purchase.product for purchase in purchases)
        top_products = [
            ProductCount(product=product, count=count) for product, count in product_counts.most_common(TOP_LIST_SIZE)
        ]
        return YearlyRecap(
            year=recap_query.year,
            scope_name=scope_name,
            grocery_runs=len(splits),
            items_bought=len(purchases),
            total_spent=round(sum(split.total for split in splits), 2),
            your_share=round(
                sum(person.total for split in splits for person in split.people if person.username == user.username), 2
            ),
            top_products=top_products,
            top_stores=self.find_top_stores(splits),
            shopping_buddy=self.find_shopping_buddy(splits, user),
            biggest_run=self.find_biggest_run(splits),
            members=member_recaps,
            headline=self.write_headline(scope_name, recap_query.year, top_products, len(splits)),
        )

    def build_member_recaps(self, splits: list[SavedSplit], names_by_username: dict[str, str]) -> list[MemberRecap]:
        item_names = [item.name for split in splits for person in split.people for item in person.items]
        products_by_raw_name = self.product_name_service.find_products(item_names)
        member_recaps = []
        for username, display_name in names_by_username.items():
            shares = [person for split in splits for person in split.people if person.username == username]
            product_counts = Counter(
                products_by_raw_name.get(item.name, item.name.lower()) for person in shares for item in person.items
            )
            member_recaps.append(
                MemberRecap(
                    name=display_name,
                    username=username,
                    share=round(sum(person.total for person in shares), 2),
                    runs_paid=sum(1 for split in splits if split.payer == username),
                    items_bought=sum(len(person.items) for person in shares),
                    top_product=product_counts.most_common(1)[0][0] if product_counts else None,
                )
            )
        return sorted(member_recaps, key=lambda member_recap: member_recap.share, reverse=True)

    def find_top_stores(self, splits: list[SavedSplit]) -> list[StoreVisit]:
        visits: Counter[str] = Counter()
        spending: dict[str, float] = {}
        for split in splits:
            store = split.store_name or UNKNOWN_STORE
            visits[store] += 1
            spending[store] = spending.get(store, 0) + split.total
        return [
            StoreVisit(store=store, visits=count, spent=round(spending[store], 2))
            for store, count in visits.most_common(TOP_LIST_SIZE)
        ]

    def find_shopping_buddy(self, splits: list[SavedSplit], user: User) -> ShoppingBuddy | None:
        buddy_counts = Counter(
            username
            for split in splits
            for username in {person.username for person in split.people} | {split.payer}
            if username != user.username
        )
        if not buddy_counts:
            return None
        buddy_username, runs = buddy_counts.most_common(1)[0]
        buddy = self.user_repository.find_by_username(buddy_username)
        return ShoppingBuddy(name=buddy.display_name if buddy else buddy_username, runs=runs)

    def find_biggest_run(self, splits: list[SavedSplit]) -> BiggestRun | None:
        if not splits:
            return None
        biggest_split = max(splits, key=lambda split: split.total)
        return BiggestRun(
            store=biggest_split.store_name or UNKNOWN_STORE,
            total=biggest_split.total,
            date=describe_split_date(biggest_split),
        )

    def write_headline(self, scope_name: str, year: int, top_products: list[ProductCount], run_count: int) -> str:
        if not top_products:
            has_not = "haven't" if scope_name == "You" else "hasn't"
            return f"{scope_name} {has_not} logged any grocery runs in {year} yet."
        top_product = top_products[0]
        times = "time" if top_product.count == 1 else "times"
        runs = "grocery run" if run_count == 1 else "grocery runs"
        owner = "Your" if scope_name == "You" else f"{scope_name}'s"
        return (
            f"{owner} #1 buy of {year} was {top_product.product}, "
            f"bought {top_product.count} {times} across {run_count} {runs}."
        )
