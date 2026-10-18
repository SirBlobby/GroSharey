from datetime import datetime, timezone

from pymongo import UpdateOne
from pymongo.database import Database


def build_raw_key(raw_name: str) -> str:
    return " ".join(raw_name.lower().split())


class ProductNameRepository:
    def __init__(self, database: Database):
        self.product_names_collection = database["product_names"]
        self.product_names_collection.create_index("raw_key", unique=True)

    def find_product_names(self, raw_keys: list[str]) -> dict[str, str]:
        documents = self.product_names_collection.find({"raw_key": {"$in": raw_keys}}, {"raw_key": 1, "product": 1})
        return {document["raw_key"]: document["product"] for document in documents}

    def save_product_names(self, products_by_raw_key: dict[str, str]) -> None:
        if not products_by_raw_key:
            return
        saved_at = datetime.now(timezone.utc)
        self.product_names_collection.bulk_write(
            [
                UpdateOne(
                    {"raw_key": raw_key},
                    {"$set": {"product": product, "updated_at": saved_at}},
                    upsert=True,
                )
                for raw_key, product in products_by_raw_key.items()
            ]
        )
