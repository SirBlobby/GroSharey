from flask import Blueprint, g, jsonify, request

from server.authentication import require_authentication
from server.dependencies import get_pantry_service, get_shopping_list_service
from server.models.shopping_list_models import (
    AddShoppingListItemRequest,
    CreateShoppingListRequest,
    UpdateShoppingListItemRequest,
)

shopping_list_blueprint = Blueprint("shopping_lists", __name__, url_prefix="/api/shopping-lists")


@shopping_list_blueprint.get("")
@require_authentication
def list_shopping_lists():
    shopping_lists = get_shopping_list_service().list_shopping_lists(g.current_user)
    return jsonify([shopping_list.model_dump(mode="json") for shopping_list in shopping_lists])


@shopping_list_blueprint.post("")
@require_authentication
def create_shopping_list():
    list_request = CreateShoppingListRequest.model_validate(request.get_json(silent=True) or {})
    shopping_list = get_shopping_list_service().create_shopping_list(list_request, g.current_user)
    return jsonify(shopping_list.model_dump(mode="json")), 201


@shopping_list_blueprint.delete("/<list_id>")
@require_authentication
def delete_shopping_list(list_id: str):
    get_shopping_list_service().delete_shopping_list(list_id, g.current_user)
    return "", 204


@shopping_list_blueprint.post("/<list_id>/items")
@require_authentication
def add_shopping_list_item(list_id: str):
    item_request = AddShoppingListItemRequest.model_validate(request.get_json(silent=True) or {})
    shopping_list = get_shopping_list_service().add_item(list_id, item_request, g.current_user)
    return jsonify(shopping_list.model_dump(mode="json")), 201


@shopping_list_blueprint.patch("/<list_id>/items/<item_id>")
@require_authentication
def update_shopping_list_item(list_id: str, item_id: str):
    item_update = UpdateShoppingListItemRequest.model_validate(request.get_json(silent=True) or {})
    shopping_list = get_shopping_list_service().set_item_crossed_off(
        list_id, item_id, item_update.is_crossed_off, g.current_user
    )
    return jsonify(shopping_list.model_dump(mode="json"))


@shopping_list_blueprint.delete("/<list_id>/items/<item_id>")
@require_authentication
def remove_shopping_list_item(list_id: str, item_id: str):
    shopping_list = get_shopping_list_service().remove_item(list_id, item_id, g.current_user)
    return jsonify(shopping_list.model_dump(mode="json"))


@shopping_list_blueprint.post("/<list_id>/pantry/<pantry_item_id>/running-low")
@require_authentication
def mark_pantry_item_running_low(list_id: str, pantry_item_id: str):
    shopping_list = get_pantry_service().mark_running_low(list_id, pantry_item_id, g.current_user)
    return jsonify(shopping_list.model_dump(mode="json"))


@shopping_list_blueprint.delete("/<list_id>/pantry/<pantry_item_id>")
@require_authentication
def use_up_pantry_item(list_id: str, pantry_item_id: str):
    shopping_list = get_pantry_service().use_up(list_id, pantry_item_id, g.current_user)
    return jsonify(shopping_list.model_dump(mode="json"))
