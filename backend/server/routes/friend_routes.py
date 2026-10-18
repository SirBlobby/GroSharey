from flask import Blueprint, g, jsonify, request

from server.authentication import require_authentication
from server.dependencies import get_friend_service
from server.models.friend_models import AddFriendRequest

friend_blueprint = Blueprint("friends", __name__, url_prefix="/api/friends")


@friend_blueprint.get("")
@require_authentication
def list_friends():
    friends = get_friend_service().list_friends(g.current_user.id)
    return jsonify([friend.model_dump(mode="json") for friend in friends])


@friend_blueprint.post("")
@require_authentication
def add_friend():
    add_friend_data = AddFriendRequest.model_validate(request.get_json(silent=True) or {})
    friend = get_friend_service().add_friend(g.current_user.id, add_friend_data.username)
    return jsonify(friend.model_dump(mode="json")), 201


@friend_blueprint.delete("/<username>")
@require_authentication
def remove_friend(username: str):
    get_friend_service().remove_friend(g.current_user.id, username.strip().lower())
    return "", 204
