from datetime import datetime, timezone

from pymongo.database import Database


def build_pair_key(first_user_id: str, second_user_id: str) -> str:
    return ":".join(sorted((first_user_id, second_user_id)))


class FriendshipRepository:
    """Friendships are mutual: one document per pair of users."""

    def __init__(self, database: Database):
        self.friendships_collection = database["friendships"]
        self.friendships_collection.create_index("pair_key", unique=True)
        self.friendships_collection.create_index("user_ids")

    def add(self, first_user_id: str, second_user_id: str) -> None:
        self.friendships_collection.update_one(
            {"pair_key": build_pair_key(first_user_id, second_user_id)},
            {
                "$setOnInsert": {
                    "user_ids": sorted((first_user_id, second_user_id)),
                    "created_at": datetime.now(timezone.utc),
                }
            },
            upsert=True,
        )

    def remove(self, first_user_id: str, second_user_id: str) -> None:
        self.friendships_collection.delete_one({"pair_key": build_pair_key(first_user_id, second_user_id)})

    def are_friends(self, first_user_id: str, second_user_id: str) -> bool:
        pair_key = build_pair_key(first_user_id, second_user_id)
        return self.friendships_collection.find_one({"pair_key": pair_key}) is not None

    def list_friend_ids(self, user_id: str) -> list[str]:
        friendship_documents = self.friendships_collection.find({"user_ids": user_id})
        return [
            other_user_id
            for friendship_document in friendship_documents
            for other_user_id in friendship_document["user_ids"]
            if other_user_id != user_id
        ]
