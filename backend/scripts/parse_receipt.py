"""Read a receipt image from disk and print the parsed JSON. For local testing.

Run from backend/:
    uv run python scripts/parse_receipt.py ../sample-receipts/costco.jpg
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from server.config import settings  # noqa: E402
from server.services.gemini_client import GeminiClient  # noqa: E402
from server.services.receipt_service import ReceiptService  # noqa: E402


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: uv run python scripts/parse_receipt.py <image>", file=sys.stderr)
        return 1
    image_path = Path(sys.argv[1])
    if not image_path.is_file():
        print(f"File not found: {image_path}", file=sys.stderr)
        return 1

    gemini_client = GeminiClient(settings.gemini_api_key, settings.gemini_model, settings.gemini_fallback_model)
    receipt_service = ReceiptService(gemini_client)
    try:
        parsed_receipt = receipt_service.parse_receipt(image_path.read_bytes())
    except Exception as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1
    print(json.dumps(parsed_receipt.model_dump(mode="json"), indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
