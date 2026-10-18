import base64

from server.errors import BadRequestError, NotFoundError
from server.models.receipt_image_models import ReceiptImage
from server.repositories.receipt_image_repository import ReceiptImageRepository
from server.repositories.split_repository import SplitRepository
from server.services.image_service import COMPRESSED_IMAGE_CONTENT_TYPE, compress_receipt_image


class ReceiptImageService:
    def __init__(self, receipt_image_repository: ReceiptImageRepository, split_repository: SplitRepository):
        self.receipt_image_repository = receipt_image_repository
        self.split_repository = split_repository

    def save_receipt_image(self, owner_id: str, image_bytes: bytes) -> str:
        compressed_image = compress_receipt_image(image_bytes)
        return self.receipt_image_repository.create(owner_id, compressed_image, COMPRESSED_IMAGE_CONTENT_TYPE)

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
