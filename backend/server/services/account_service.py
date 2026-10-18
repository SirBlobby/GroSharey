from server.errors import BadRequestError, ConflictError, NotFoundError
from server.models.user_models import ChangePasswordRequest, ChangeUsernameRequest, StoredUser, User
from server.repositories.payment_repository import PaymentRepository
from server.repositories.split_repository import SplitRepository
from server.repositories.user_repository import UserRepository
from server.services.audit_log_service import AuditLogService
from server.services.password_service import hash_password, verify_password
from server.services.user_mapper import convert_to_user


class AccountService:
    def __init__(
        self,
        user_repository: UserRepository,
        split_repository: SplitRepository,
        payment_repository: PaymentRepository,
        audit_log_service: AuditLogService,
    ):
        self.user_repository = user_repository
        self.split_repository = split_repository
        self.payment_repository = payment_repository
        self.audit_log_service = audit_log_service

    def verify_current_password(self, user_id: str, current_password: str) -> StoredUser:
        stored_user = self.user_repository.find_by_id(user_id)
        if stored_user is None:
            raise NotFoundError("User", user_id)
        if not verify_password(current_password, stored_user.password_hash):
            raise BadRequestError("Your current password is incorrect")
        return stored_user

    def change_username(self, current_user: User, change_request: ChangeUsernameRequest) -> User:
        stored_user = self.verify_current_password(current_user.id, change_request.current_password)
        old_username = stored_user.username
        new_username = change_request.username
        if new_username == old_username:
            return convert_to_user(stored_user)

        user_with_username = self.user_repository.find_by_username(new_username)
        if user_with_username is not None and user_with_username.id != stored_user.id:
            raise ConflictError("That username is already taken")

        updated_user = self.user_repository.set_username(stored_user.id, new_username)
        if updated_user is None:
            raise NotFoundError("User", stored_user.id)
        self.split_repository.rename_user(stored_user.id, new_username)
        self.payment_repository.rename_user(stored_user.id, new_username)
        self.audit_log_service.record(
            stored_user.id,
            "account",
            "changed_username",
            f"Changed your username from @{old_username} to @{new_username}",
            new_username,
        )
        return convert_to_user(updated_user)

    def change_password(self, current_user: User, change_request: ChangePasswordRequest) -> None:
        stored_user = self.verify_current_password(current_user.id, change_request.current_password)
        if change_request.new_password == change_request.current_password:
            raise BadRequestError("Choose a password that's different from your current one")
        self.user_repository.set_password_hash(stored_user.id, hash_password(change_request.new_password))
        self.audit_log_service.record(
            stored_user.id, "account", "changed_password", "Changed your password", stored_user.username
        )
