from datetime import datetime

from pydantic import BaseModel, Field


class Purchase(BaseModel):
    product: str
    raw_name: str
    store: str
    price: float
    date: str
    logged_at: datetime


class PriceComparison(BaseModel):
    product: str
    cheapest_store: str
    cheapest_price: float
    cheapest_date: str
    latest_store: str
    latest_price: float
    latest_date: str
    highest_price: float
    purchase_count: int
    store_count: int
    savings: float
    tip: str | None


class PriceWatch(BaseModel):
    comparisons: list[PriceComparison]
    tracked_products: int


class RecapQuery(BaseModel):
    year: int = Field(ge=2000, le=2100)
    group_id: str | None = None


class ProductCount(BaseModel):
    product: str
    count: int


class StoreVisit(BaseModel):
    store: str
    visits: int
    spent: float


class ShoppingBuddy(BaseModel):
    name: str
    runs: int


class BiggestRun(BaseModel):
    store: str
    total: float
    date: str


class MemberRecap(BaseModel):
    name: str
    username: str
    share: float
    runs_paid: int
    items_bought: int
    top_product: str | None


class YearlyRecap(BaseModel):
    year: int
    scope_name: str
    grocery_runs: int
    items_bought: int
    total_spent: float
    your_share: float
    top_products: list[ProductCount]
    top_stores: list[StoreVisit]
    shopping_buddy: ShoppingBuddy | None
    biggest_run: BiggestRun | None
    members: list[MemberRecap] = []
    headline: str
