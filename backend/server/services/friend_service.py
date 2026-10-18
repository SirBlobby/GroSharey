from server.errors import BadRequestError, NotFoundError
from server.models.friend_models import Friend
from server.models.user_models import StoredUser
from server.repositories.friendship_repository import FriendshipRepository
from server.repositories.split_repository import SplitRepository
from server.repositories.user_repository import UserRepository
from server.services.user_mapper import convert_to_public_profile


class FriendService:
    def __init__(
        self,
        user_repository: UserRepository,
        friendship_repository: FriendshipRepository,
        split_repository: SplitRepository,
    ):
        self.user_repository = user_repository
        self.friendship_repository = friendship_repository
        self.split_repository = split_repository

    def find_user_by_username(self, username: str) -> StoredUser:
        stored_user = self.user_repository.find_by_username(username)
        if stored_user is None:
            raise NotFoundError("User", username)
        return stored_user

    def build_friends(self, user_id: str, friend_users: list[StoredUser]) -> list[Friend]:
        owed_to_user = self.split_repository.sum_owed_to_payer(user_id)
        owed_by_user = self.split_repository.sum_owed_by_user(user_id)
        friends = [
            Friend(
                **convert_to_public_profile(friend_user).model_dump(),
                balance=(owed_to_user.get(friend_user.id, 0) - owed_by_user.get(friend_user.id, 0)) / 100,
            )
            for friend_user in friend_users
        ]
        return sorted(friends, key=lambda friend: friend.display_name.lower())

    def list_friends(self, user_id: str) -> list[Friend]:
        friend_users = self.user_repository.find_by_ids(self.friendship_repository.list_friend_ids(user_id))
        return self.build_friends(user_id, friend_users)

    def add_friend(self, user_id: str, username: str) -> Friend:
        friend_user = self.find_user_by_username(username)
        if friend_user.id == user_id:
            raise BadRequestError("You can't add yourself as a friend")
        self.friendship_repository.add(user_id, friend_user.id)
        return self.build_friends(user_id, [friend_user])[0]

    def remove_friend(self, user_id: str, username: str) -> None:
        friend_user = self.find_user_by_username(username)
        self.friendship_repository.remove(user_id, friend_user.id)
