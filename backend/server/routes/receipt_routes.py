from flask import Blueprint, g, jsonify, request

from server.authentication import require_authentication
from server.dependencies import get_receipt_service
from server.models.receipt_models import ReceiptImageUpload
from server.models.split_models import SplitRequest
from server.services.image_service import decode_base64_image
from server.services.split_service import split_receipt

receipt_blueprint = Blueprint("receipts", __name__, url_prefix="/api/receipts")


@receipt_blueprint.post("/parse")
@require_authentication
def parse_receipt():
    upload_data = ReceiptImageUpload.model_validate(request.get_json(silent=True) or {})
    parsed_receipt = get_receipt_service().parse_receipt(decode_base64_image(upload_data.image_base64))
    return jsonify(parsed_receipt.model_dump(mode="json"))


@receipt_blueprint.post("/split")
@require_authentication
def split_parsed_receipt():
    split_request = SplitRequest.model_validate(request.get_json(silent=True) or {})
    split_result = split_receipt(split_request.receipt, split_request.assignments, g.current_user.username)
    return jsonify(split_result.model_dump(mode="json"))
