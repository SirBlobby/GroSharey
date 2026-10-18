from functools import lru_cache

from server.config import settings
from server.database import get_database
from server.repositories.audit_log_repository import AuditLogRepository
from server.repositories.friendship_repository import FriendshipRepository
from server.repositories.group_repository import GroupRepository
from server.repositories.pantry_repository import PantryRepository
from server.repositories.payment_repository import PaymentRepository
from server.repositories.profile_picture_repository import ProfilePictureRepository
from server.repositories.receipt_image_repository import ReceiptImageRepository
from server.repositories.shopping_list_repository import ShoppingListRepository
from server.repositories.split_repository import SplitRepository
from server.repositories.user_repository import UserRepository
from server.services.account_service import AccountService
from server.services.assistant.assistant_context import AssistantServices
from server.services.assistant.assistant_service import AssistantService
from server.services.audit_log_service import AuditLogService
from server.services.auth_service import AuthService
from server.services.elevenlabs_client import ElevenLabsClient
from server.services.email_service import EmailService
from server.services.friend_service import FriendService
from server.services.gemini_client import GeminiClient
from server.services.group_service import GroupService
from server.services.group_trip_service import GroupTripService
from server.services.item_matching_service import ItemMatchingService
from server.services.notification_service import NotificationService
from server.services.pantry_service import PantryService
from server.services.payment_reminder_service import PaymentReminderService
from server.services.payment_service import PaymentService
from server.services.profile_service import ProfileService
from server.services.receipt_image_service import ReceiptImageService
from server.services.receipt_service import ReceiptService
from server.services.shopping_list_matching_service import ShoppingListMatchingService
from server.services.shopping_list_service import ShoppingListService
from server.services.split_dispute_service import SplitDisputeService
from server.services.split_report_service import SplitReportService
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
def get_gemini_client() -> GeminiClient:
    return GeminiClient(settings.gemini_api_key, settings.gemini_model, settings.gemini_fallback_model)


@lru_cache
def get_receipt_service() -> ReceiptService:
    return ReceiptService(get_gemini_client())


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
        get_friendship_repository(),
        get_payment_repository(),
        get_friend_service(),
        get_audit_log_service(),
        get_notification_service(),
    )


@lru_cache
def get_notification_service() -> NotificationService:
    email_service = EmailService(
        settings.email_sender_address, settings.email_app_password, settings.smtp_host, settings.smtp_port
    )
    return NotificationService(email_service, settings.app_url)


@lru_cache
def get_receipt_image_service() -> ReceiptImageService:
    return ReceiptImageService(ReceiptImageRepository(get_database()), get_split_repository(), get_audit_log_service())


@lru_cache
def get_split_service() -> SplitService:
    return SplitService(
        get_user_repository(),
        get_friendship_repository(),
        get_split_repository(),
        get_notification_service(),
        get_receipt_image_service(),
        get_audit_log_service(),
        get_group_service(),
        get_shopping_list_matching_service(),
        get_group_trip_service(),
    )


@lru_cache
def get_account_service() -> AccountService:
    return AccountService(
        get_user_repository(), get_split_repository(), get_payment_repository(), get_audit_log_service()
    )


@lru_cache
def get_group_repository() -> GroupRepository:
    return GroupRepository(get_database())


@lru_cache
def get_shopping_list_repository() -> ShoppingListRepository:
    return ShoppingListRepository(get_database())


@lru_cache
def get_group_service() -> GroupService:
    return GroupService(
        get_user_repository(),
        get_friendship_repository(),
        get_group_repository(),
        get_shopping_list_repository(),
        get_split_repository(),
        get_audit_log_service(),
    )


@lru_cache
def get_shopping_list_service() -> ShoppingListService:
    return ShoppingListService(
        get_user_repository(),
        get_group_repository(),
        get_shopping_list_repository(),
        get_pantry_repository(),
        get_audit_log_service(),
    )


@lru_cache
def get_shopping_list_matching_service() -> ShoppingListMatchingService:
    return ShoppingListMatchingService(
        get_user_repository(),
        get_group_service(),
        get_shopping_list_repository(),
        get_pantry_repository(),
        ItemMatchingService(get_gemini_client()),
        get_audit_log_service(),
    )


@lru_cache
def get_split_dispute_service() -> SplitDisputeService:
    return SplitDisputeService(get_split_repository(), get_audit_log_service())


@lru_cache
def get_pantry_repository() -> PantryRepository:
    return PantryRepository(get_database())


@lru_cache
def get_pantry_service() -> PantryService:
    return PantryService(
        get_shopping_list_service(), get_shopping_list_repository(), get_pantry_repository(), get_audit_log_service()
    )


@lru_cache
def get_group_trip_service() -> GroupTripService:
    return GroupTripService(get_group_service(), get_group_repository(), get_audit_log_service())


@lru_cache
def get_split_report_service() -> SplitReportService:
    return SplitReportService(get_split_repository())


@lru_cache
def get_assistant_service() -> AssistantService:
    elevenlabs_client = ElevenLabsClient(
        settings.elevenlabs_api_key,
        settings.elevenlabs_voice_id,
        settings.elevenlabs_speech_model,
        settings.elevenlabs_transcription_model,
    )
    assistant_services = AssistantServices(
        shopping_list_service=get_shopping_list_service(),
        pantry_service=get_pantry_service(),
        group_service=get_group_service(),
        group_trip_service=get_group_trip_service(),
        friend_service=get_friend_service(),
        payment_service=get_payment_service(),
        payment_reminder_service=get_payment_reminder_service(),
        split_service=get_split_service(),
        split_dispute_service=get_split_dispute_service(),
    )
    return AssistantService(get_gemini_client(), elevenlabs_client, assistant_services)


@lru_cache
def get_payment_reminder_service() -> PaymentReminderService:
    return PaymentReminderService(
        get_friend_service(), get_friendship_repository(), get_notification_service(), get_audit_log_service()
    )
