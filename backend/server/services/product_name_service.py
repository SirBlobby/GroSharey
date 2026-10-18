import json
import logging

from google.genai import types
from pydantic import BaseModel

from server.repositories.product_name_repository import ProductNameRepository, build_raw_key
from server.services.gemini_client import GeminiClient, GeminiErrorMessages

logger = logging.getLogger(__name__)

MAX_NAMES_PER_REQUEST = 120

PRODUCT_NAME_PROMPT = """You turn grocery receipt item names into short, plain product names so the same \
product can be compared across stores and receipts.

- Expand store codes and abbreviations ("GV 2% MLK GAL" becomes "2% milk, 1 gallon").
- Drop brand names unless the brand is the product ("Coca-Cola, 12 pack" is fine).
- Keep the size or count when it's printed, because prices only compare for the same size.
- Use lowercase, singular, everyday words. "Large eggs, 18 count", not "EGGS LG 18CT".
- Give the same product name to names that are the same product and size.
- Return one entry for every input name, using the exact input text as raw_name."""

PRODUCT_NAME_ERROR_MESSAGES = GeminiErrorMessages(
    not_configured="Product names are not configured on the server",
    rate_limited="Too many requests at once. Try again in a minute.",
    failed="Couldn't read product names right now.",
    busy="Product names are busy right now.",
)


class ProductName(BaseModel):
    raw_name: str
    product: str


class ProductNameResult(BaseModel):
    products: list[ProductName]


def clean_fallback_name(raw_name: str) -> str:
    return " ".join(raw_name.lower().split())


class ProductNameService:
    def __init__(self, gemini_client: GeminiClient, product_name_repository: ProductNameRepository):
        self.gemini_client = gemini_client
        self.product_name_repository = product_name_repository

    def find_products(self, raw_names: list[str]) -> dict[str, str]:
        raw_keys = list(dict.fromkeys(build_raw_key(raw_name) for raw_name in raw_names if raw_name.strip()))
        products_by_raw_key = self.product_name_repository.find_product_names(raw_keys)
        unknown_keys = [raw_key for raw_key in raw_keys if raw_key not in products_by_raw_key]
        for start in range(0, len(unknown_keys), MAX_NAMES_PER_REQUEST):
            new_products = self.ask_gemini(unknown_keys[start : start + MAX_NAMES_PER_REQUEST])
            self.product_name_repository.save_product_names(new_products)
            products_by_raw_key.update(new_products)
        return {
            raw_name: products_by_raw_key.get(build_raw_key(raw_name), clean_fallback_name(raw_name))
            for raw_name in raw_names
        }

    def ask_gemini(self, raw_keys: list[str]) -> dict[str, str]:
        try:
            response = self.gemini_client.generate(
                contents=[json.dumps({"item_names": raw_keys})],
                config=types.GenerateContentConfig(
                    system_instruction=PRODUCT_NAME_PROMPT,
                    response_mime_type="application/json",
                    response_schema=ProductNameResult,
                ),
                error_messages=PRODUCT_NAME_ERROR_MESSAGES,
                fall_back_when_rate_limited=True,
            )
        except Exception:
            logger.exception("Could not get product names, comparing raw item names instead")
            return {}
        if not isinstance(response.parsed, ProductNameResult):
            return {}
        wanted_keys = set(raw_keys)
        return {
            build_raw_key(product_name.raw_name): product_name.product.strip().lower()
            for product_name in response.parsed.products
            if build_raw_key(product_name.raw_name) in wanted_keys and product_name.product.strip()
        }
