from flask import Blueprint, g, jsonify, request

from server.authentication import require_authentication
from server.dependencies import get_group_service, get_shopping_list_matching_service
from server.models.group_models import GroupRequest
from server.models.shopping_list_models import MatchItemsRequest

group_blueprint = Blueprint("groups", __name__, url_prefix="/api/groups")


@group_blueprint.get("")
@require_authentication
def list_groups():
    groups = get_group_service().list_groups(g.current_user)
    return jsonify([group.model_dump(mode="json") for group in groups])


@group_blueprint.post("")
@require_authentication
def create_group():
    group_request = GroupRequest.model_validate(request.get_json(silent=True) or {})
    group = get_group_service().create_group(group_request, g.current_user)
    return jsonify(group.model_dump(mode="json")), 201


@group_blueprint.put("/<group_id>")
@require_authentication
def update_group(group_id: str):
    group_request = GroupRequest.model_validate(request.get_json(silent=True) or {})
    group = get_group_service().update_group(group_id, group_request, g.current_user)
    return jsonify(group.model_dump(mode="json"))


@group_blueprint.delete("/<group_id>")
@require_authentication
def delete_group(group_id: str):
    get_group_service().delete_group(group_id, g.current_user)
    return "", 204


@group_blueprint.post("/<group_id>/leave")
@require_authentication
def leave_group(group_id: str):
    get_group_service().leave_group(group_id, g.current_user)
    return "", 204


@group_blueprint.post("/<group_id>/match-items")
@require_authentication
def match_group_items(group_id: str):
    match_request = MatchItemsRequest.model_validate(request.get_json(silent=True) or {})
    group_item_matches = get_shopping_list_matching_service().match_group_items(
        group_id, match_request, g.current_user
    )
    return jsonify(group_item_matches.model_dump(mode="json"))
