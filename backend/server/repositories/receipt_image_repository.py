from datetime import datetime, timezone

from bson import Binary, ObjectId
from pymongo.database import Database

from server.models.receipt_image_models import StoredReceiptImage


class ReceiptImageRepository:
    def __init__(self, database: Database):
        self.receipt_images_collection = database["receipt_images"]
        self.receipt_images_collection.create_index("owner_id")

    def create(self, owner_id: str, image_bytes: bytes, content_type: str) -> str:
        insert_result = self.receipt_images_collection.insert_one(
            {
                "owner_id": owner_id,
                "image_data": Binary(image_bytes),
                "content_type": content_type,
                "created_at": datetime.now(timezone.utc),
            }
        )
        return str(insert_result.inserted_id)

    def find_by_id(self, receipt_image_id: str) -> StoredReceiptImage | None:
        if not ObjectId.is_valid(receipt_image_id):
            return None
        image_document = self.receipt_images_collection.find_one({"_id": ObjectId(receipt_image_id)})
        if image_document is None:
            return None
        return StoredReceiptImage(
            id=str(image_document["_id"]),
            owner_id=image_document["owner_id"],
            image_data=bytes(image_document["image_data"]),
            content_type=image_document["content_type"],
        )
