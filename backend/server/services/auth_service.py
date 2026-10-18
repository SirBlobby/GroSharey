from server.errors import UnauthorizedError
from server.models.user_models import AuthResponse, LogInRequest, SignUpRequest, StoredUser, User
from server.repositories.user_repository import UserRepository
from server.services.audit_log_service import AuditLogService
from server.services.password_service import hash_password, verify_password
from server.services.token_service import create_access_token, read_user_id_from_token
from server.services.user_mapper import convert_to_user


def build_auth_response(stored_user: StoredUser) -> AuthResponse:
    return AuthResponse(
        access_token=create_access_token(stored_user.id),
        user=convert_to_user(stored_user),
    )


class AuthService:
    def __init__(self, user_repository: UserRepository, audit_log_service: AuditLogService):
        self.user_repository = user_repository
        self.audit_log_service = audit_log_service

    def sign_up(self, sign_up_data: SignUpRequest) -> AuthResponse:
        normalized_email = sign_up_data.email.lower()
        password_hash = hash_password(sign_up_data.password)
        stored_user = self.user_repository.create(
            email=normalized_email,
            username=sign_up_data.username,
            display_name=sign_up_data.display_name,
            password_hash=password_hash,
        )
        self.audit_log_service.record(
            stored_user.id, "account", "signed_up", "Created your account", stored_user.username
        )
        return build_auth_response(stored_user)

    def log_in(self, log_in_data: LogInRequest) -> AuthResponse:
        stored_user = self.user_repository.find_by_email(log_in_data.email.lower())
        if stored_user is None:
            raise UnauthorizedError("Invalid email or password")
        if not verify_password(log_in_data.password, stored_user.password_hash):
            self.audit_log_service.record(
                stored_user.id, "account", "log_in_failed", "Someone tried to log in with a wrong password"
            )
            raise UnauthorizedError("Invalid email or password")
        self.audit_log_service.record(stored_user.id, "account", "logged_in", "Logged in", stored_user.username)
        return build_auth_response(stored_user)

    def get_user_from_token(self, access_token: str) -> User:
        user_id = read_user_id_from_token(access_token)
        stored_user = self.user_repository.find_by_id(user_id)
        if stored_user is None:
            raise UnauthorizedError("User no longer exists")
        return convert_to_user(stored_user)
