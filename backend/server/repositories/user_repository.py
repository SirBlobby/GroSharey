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
        password_hash=user_document["password_hash"],
        created_at=user_document["created_at"],
    )


class UserRepository:
    def __init__(self, database: Database):
        self.users_collection = database["users"]
        self.users_collection.create_index("email", unique=True)

    def find_by_email(self, email: str) -> StoredUser | None:
        user_document = self.users_collection.find_one({"email": email})
        return convert_document_to_user(user_document) if user_document else None

    def find_by_id(self, user_id: str) -> StoredUser | None:
        if not ObjectId.is_valid(user_id):
            return None
        user_document = self.users_collection.find_one({"_id": ObjectId(user_id)})
        return convert_document_to_user(user_document) if user_document else None

    def create(self, email: str, password_hash: str) -> StoredUser:
        user_document = {
            "email": email,
            "password_hash": password_hash,
            "created_at": datetime.now(timezone.utc),
        }
        try:
            insert_result = self.users_collection.insert_one(user_document)
        except DuplicateKeyError:
            raise ConflictError("An account with this email already exists")
        user_document["_id"] = insert_result.inserted_id
        return convert_document_to_user(user_document)
