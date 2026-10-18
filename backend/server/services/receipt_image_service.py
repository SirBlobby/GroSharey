import base64

from server.errors import BadRequestError, NotFoundError
from server.models.receipt_image_models import ReceiptImage
from server.models.user_models import User
from server.repositories.receipt_image_repository import ReceiptImageRepository
from server.repositories.split_repository import SplitRepository
from server.services.audit_log_service import AuditLogService
from server.services.audit_messages import describe_scanned_receipt
from server.services.image_service import COMPRESSED_IMAGE_CONTENT_TYPE, compress_receipt_image


class ReceiptImageService:
    def __init__(
        self,
        receipt_image_repository: ReceiptImageRepository,
        split_repository: SplitRepository,
        audit_log_service: AuditLogService,
    ):
        self.receipt_image_repository = receipt_image_repository
        self.split_repository = split_repository
        self.audit_log_service = audit_log_service

    def save_receipt_image(self, owner: User, image_bytes: bytes, store_name: str | None) -> str:
        compressed_image = compress_receipt_image(image_bytes)
        receipt_image_id = self.receipt_image_repository.create(
            owner.id, compressed_image, COMPRESSED_IMAGE_CONTENT_TYPE
        )
        self.audit_log_service.record(
            owner.id, "splits", "scanned_receipt", describe_scanned_receipt(store_name), owner.username
        )
        return receipt_image_id

    def ensure_owned_by(self, receipt_image_id: str, user_id: str) -> None:
        stored_image = self.receipt_image_repository.find_by_id(receipt_image_id)
        if stored_image is None or stored_image.owner_id != user_id:
            raise BadRequestError("That receipt image doesn't belong to you")

    def get_receipt_image(self, receipt_image_id: str, user_id: str) -> ReceiptImage:
        stored_image = self.receipt_image_repository.find_by_id(receipt_image_id)
        if stored_image is None:
            raise NotFoundError("Receipt image", receipt_image_id)
        is_owner = stored_image.owner_id == user_id
        if not is_owner and not self.split_repository.is_receipt_image_shared_with(receipt_image_id, user_id):
            raise NotFoundError("Receipt image", receipt_image_id)
        encoded_image = base64.b64encode(stored_image.image_data).decode("ascii")
        return ReceiptImage(
            id=stored_image.id,
            image_data_url=f"data:{stored_image.content_type};base64,{encoded_image}",
        )
