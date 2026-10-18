from functools import lru_cache

from server.config import settings
from server.database import get_database
from server.repositories.audit_log_repository import AuditLogRepository
from server.repositories.friendship_repository import FriendshipRepository
from server.repositories.payment_repository import PaymentRepository
from server.repositories.profile_picture_repository import ProfilePictureRepository
from server.repositories.receipt_image_repository import ReceiptImageRepository
from server.repositories.split_repository import SplitRepository
from server.repositories.user_repository import UserRepository
from server.services.audit_log_service import AuditLogService
from server.services.auth_service import AuthService
from server.services.email_service import EmailService
from server.services.friend_service import FriendService
from server.services.notification_service import NotificationService
from server.services.payment_service import PaymentService
from server.services.profile_service import ProfileService
from server.services.receipt_image_service import ReceiptImageService
from server.services.receipt_service import ReceiptService
from server.services.split_service import SplitService


@lru_cache
def get_user_repository() -> UserRepository:
    return UserRepository(get_database())


@lru_cache
def get_audit_log_service() -> AuditLogService:
    return AuditLogService(AuditLogRepository(get_database()))


@lru_cache
def get_auth_service() -> AuthService:
    return AuthService(get_user_repository(), get_audit_log_service())


@lru_cache
def get_profile_service() -> ProfileService:
    return ProfileService(get_user_repository(), ProfilePictureRepository(get_database()), get_audit_log_service())


@lru_cache
def get_receipt_service() -> ReceiptService:
    return ReceiptService(settings.gemini_api_key, settings.gemini_model, settings.gemini_fallback_model)


@lru_cache
def get_friendship_repository() -> FriendshipRepository:
    return FriendshipRepository(get_database())


@lru_cache
def get_split_repository() -> SplitRepository:
    return SplitRepository(get_database())


@lru_cache
def get_payment_repository() -> PaymentRepository:
    return PaymentRepository(get_database())


@lru_cache
def get_friend_service() -> FriendService:
    return FriendService(
        get_user_repository(),
        get_friendship_repository(),
        get_split_repository(),
        get_payment_repository(),
        get_audit_log_service(),
    )


@lru_cache
def get_payment_service() -> PaymentService:
    return PaymentService(
        get_friendship_repository(), get_payment_repository(), get_friend_service(), get_audit_log_service()
    )


@lru_cache
def get_notification_service() -> NotificationService:
    email_service = EmailService(
        settings.email_sender_address, settings.email_app_password, settings.smtp_host, settings.smtp_port
    )
    return NotificationService(email_service, settings.app_url)


@lru_cache
def get_receipt_image_service() -> ReceiptImageService:
    return ReceiptImageService(ReceiptImageRepository(get_database()), get_split_repository())


@lru_cache
def get_split_service() -> SplitService:
    return SplitService(
        get_user_repository(),
        get_friendship_repository(),
        get_split_repository(),
        get_notification_service(),
        get_receipt_image_service(),
        get_audit_log_service(),
    )
