from functools import lru_cache

from server.database import get_database
from server.repositories.profile_picture_repository import ProfilePictureRepository
from server.repositories.user_repository import UserRepository
from server.services.auth_service import AuthService
from server.services.profile_service import ProfileService


@lru_cache
def get_user_repository() -> UserRepository:
    return UserRepository(get_database())


@lru_cache
def get_auth_service() -> AuthService:
    return AuthService(get_user_repository())


@lru_cache
def get_profile_service() -> ProfileService:
    return ProfileService(get_user_repository(), ProfilePictureRepository(get_database()))
