from datetime import datetime, timezone

from bson import ObjectId
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from server.errors import ConflictError
from server.models.user_models import StoredUser


def convert_document_to_user(user_document: dict) -> StoredUser:
    return StoredUser(
        id=str(user_document["_id"]),
        email=user_document["email"],
        username=user_document["username"],
        display_name=user_document["display_name"],
        password_hash=user_document["password_hash"],
        created_at=user_document["created_at"],
        profile_picture_version=user_document.get("profile_picture_version"),
    )


def read_duplicate_field_name(error: DuplicateKeyError) -> str:
    duplicate_key_pattern = (error.details or {}).get("keyPattern", {})
    return next(iter(duplicate_key_pattern), "email")


class UserRepository:
    def __init__(self, database: Database):
        self.users_collection = database["users"]
        self.users_collection.create_index("email", unique=True)
        self.users_collection.create_index(
            "username",
            unique=True,
            partialFilterExpression={"username": {"$type": "string"}},
        )

    def find_by_email(self, email: str) -> StoredUser | None:
        user_document = self.users_collection.find_one({"email": email})
        return convert_document_to_user(user_document) if user_document else None

    def find_by_username(self, username: str) -> StoredUser | None:
        user_document = self.users_collection.find_one({"username": username})
        return convert_document_to_user(user_document) if user_document else None

    def find_by_id(self, user_id: str) -> StoredUser | None:
        if not ObjectId.is_valid(user_id):
            return None
        user_document = self.users_collection.find_one({"_id": ObjectId(user_id)})
        return convert_document_to_user(user_document) if user_document else None

    def find_by_ids(self, user_ids: list[str]) -> list[StoredUser]:
        object_ids = [ObjectId(user_id) for user_id in user_ids if ObjectId.is_valid(user_id)]
        user_documents = self.users_collection.find({"_id": {"$in": object_ids}})
        return [convert_document_to_user(user_document) for user_document in user_documents]

    def create(self, email: str, username: str, display_name: str, password_hash: str) -> StoredUser:
        user_document = {
            "email": email,
            "username": username,
            "display_name": display_name,
            "password_hash": password_hash,
            "created_at": datetime.now(timezone.utc),
        }
        try:
            insert_result = self.users_collection.insert_one(user_document)
        except DuplicateKeyError as error:
            raise ConflictError(f"An account with this {read_duplicate_field_name(error)} already exists")
        user_document["_id"] = insert_result.inserted_id
        return convert_document_to_user(user_document)

    def set_profile_picture_version(self, user_id: str, picture_version: int) -> StoredUser | None:
        self.users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"profile_picture_version": picture_version}},
        )
        return self.find_by_id(user_id)
