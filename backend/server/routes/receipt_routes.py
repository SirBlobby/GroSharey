from flask import Blueprint, g, jsonify, request

from server.authentication import require_authentication
from server.dependencies import get_receipt_image_service, get_receipt_service, get_split_service
from server.models.receipt_models import ReceiptImageUpload
from server.models.split_models import SplitRequest
from server.services.image_service import decode_base64_image

receipt_blueprint = Blueprint("receipts", __name__, url_prefix="/api/receipts")


@receipt_blueprint.post("/parse")
@require_authentication
def parse_receipt():
    upload_data = ReceiptImageUpload.model_validate(request.get_json(silent=True) or {})
    image_bytes = decode_base64_image(upload_data.image_base64)
    parsed_receipt = get_receipt_service().parse_receipt(image_bytes)
    receipt_image_id = get_receipt_image_service().save_receipt_image(
        g.current_user, image_bytes, parsed_receipt.store_name
    )
    return jsonify(parsed_receipt.model_copy(update={"receipt_image_id": receipt_image_id}).model_dump(mode="json"))


@receipt_blueprint.get("/images/<receipt_image_id>")
@require_authentication
def get_receipt_image(receipt_image_id: str):
    receipt_image = get_receipt_image_service().get_receipt_image(receipt_image_id, g.current_user.id)
    return jsonify(receipt_image.model_dump(mode="json"))


@receipt_blueprint.post("/split")
@require_authentication
def split_parsed_receipt():
    split_request = SplitRequest.model_validate(request.get_json(silent=True) or {})
    split_result = get_split_service().preview_split(split_request, g.current_user)
    return jsonify(split_result.model_dump(mode="json"))
