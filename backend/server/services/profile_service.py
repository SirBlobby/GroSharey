import time

from server.errors import NotFoundError
from server.models.payment_models import PaymentHandlesUpdate
from server.models.user_models import PublicProfile, StoredUser, User
from server.repositories.profile_picture_repository import ProfilePictureRepository
from server.repositories.user_repository import UserRepository
from server.services.image_service import (
    COMPRESSED_IMAGE_CONTENT_TYPE,
    compress_image_losslessly,
    decode_base64_image,
)
from server.services.user_mapper import convert_to_public_profile, convert_to_user


class ProfileService:
    def __init__(self, user_repository: UserRepository, profile_picture_repository: ProfilePictureRepository):
        self.user_repository = user_repository
        self.profile_picture_repository = profile_picture_repository

    def find_stored_user_by_username(self, username: str) -> StoredUser:
        stored_user = self.user_repository.find_by_username(username.strip().lower())
        if stored_user is None:
            raise NotFoundError("User", username)
        return stored_user

    def get_profile_by_username(self, username: str) -> PublicProfile:
        return convert_to_public_profile(self.find_stored_user_by_username(username))

    def upload_profile_picture(self, user_id: str, image_base64: str) -> User:
        compressed_image = compress_image_losslessly(decode_base64_image(image_base64))
        self.profile_picture_repository.save(user_id, compressed_image, COMPRESSED_IMAGE_CONTENT_TYPE)
        updated_user = self.user_repository.set_profile_picture_version(user_id, int(time.time()))
        if updated_user is None:
            raise NotFoundError("User", user_id)
        return convert_to_user(updated_user)

    def get_profile_picture(self, username: str) -> tuple[bytes, str]:
        stored_user = self.find_stored_user_by_username(username)
        profile_picture = self.profile_picture_repository.find_by_user_id(stored_user.id)
        if profile_picture is None:
            raise NotFoundError("Profile picture", username)
        return profile_picture

    def update_payment_handles(self, user_id: str, handles: PaymentHandlesUpdate) -> User:
        updated_user = self.user_repository.set_payment_handles(
            user_id, handles.venmo_username, handles.paypal_username
        )
        if updated_user is None:
            raise NotFoundError("User", user_id)
        return convert_to_user(updated_user)
