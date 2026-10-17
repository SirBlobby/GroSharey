from server.errors import UnauthorizedError
from server.models.user_models import AuthResponse, LogInRequest, SignUpRequest, StoredUser, User
from server.repositories.user_repository import UserRepository
from server.services.password_service import hash_password, verify_password
from server.services.token_service import create_access_token, read_user_id_from_token


def convert_to_public_user(stored_user: StoredUser) -> User:
    return User(**stored_user.model_dump(exclude={"password_hash"}))


def build_auth_response(stored_user: StoredUser) -> AuthResponse:
    return AuthResponse(
        access_token=create_access_token(stored_user.id),
        user=convert_to_public_user(stored_user),
    )


class AuthService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    def sign_up(self, sign_up_data: SignUpRequest) -> AuthResponse:
        normalized_email = sign_up_data.email.lower()
        password_hash = hash_password(sign_up_data.password)
        stored_user = self.user_repository.create(normalized_email, password_hash)
        return build_auth_response(stored_user)

    def log_in(self, log_in_data: LogInRequest) -> AuthResponse:
        stored_user = self.user_repository.find_by_email(log_in_data.email.lower())
        if stored_user is None or not verify_password(log_in_data.password, stored_user.password_hash):
            raise UnauthorizedError("Invalid email or password")
        return build_auth_response(stored_user)

    def get_user_from_token(self, access_token: str) -> User:
        user_id = read_user_id_from_token(access_token)
        stored_user = self.user_repository.find_by_id(user_id)
        if stored_user is None:
            raise UnauthorizedError("User no longer exists")
        return convert_to_public_user(stored_user)
