from functools import lru_cache

from server.database import get_database
from server.repositories.user_repository import UserRepository
from server.services.auth_service import AuthService


@lru_cache
def get_auth_service() -> AuthService:
    return AuthService(UserRepository(get_database()))
