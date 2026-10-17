from datetime import datetime, timezone

from bson import Binary, ObjectId
from pymongo.database import Database


class ProfilePictureRepository:
    def __init__(self, database: Database):
        self.profile_pictures_collection = database["profile_pictures"]

    def save(self, user_id: str, image_bytes: bytes, content_type: str) -> None:
        self.profile_pictures_collection.replace_one(
            {"_id": ObjectId(user_id)},
            {
                "image_data": Binary(image_bytes),
                "content_type": content_type,
                "updated_at": datetime.now(timezone.utc),
            },
            upsert=True,
        )

    def find_by_user_id(self, user_id: str) -> tuple[bytes, str] | None:
        picture_document = self.profile_pictures_collection.find_one({"_id": ObjectId(user_id)})
        if picture_document is None:
            return None
        return bytes(picture_document["image_data"]), picture_document["content_type"]
