from flask import Blueprint, g, jsonify, request

from server.authentication import require_authentication
from server.dependencies import get_split_service
from server.models.split_models import SplitRequest

split_blueprint = Blueprint("splits", __name__, url_prefix="/api/splits")


@split_blueprint.post("")
@require_authentication
def save_split():
    split_request = SplitRequest.model_validate(request.get_json(silent=True) or {})
    saved_split = get_split_service().save_split(split_request, g.current_user)
    return jsonify(saved_split.model_dump(mode="json")), 201


@split_blueprint.get("")
@require_authentication
def list_splits():
    splits = get_split_service().list_splits(g.current_user.id)
    return jsonify([split.model_dump(mode="json") for split in splits])
