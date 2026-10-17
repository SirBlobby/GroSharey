from flask import Blueprint, g, jsonify, request

from server.authentication import require_authentication
from server.dependencies import get_auth_service
from server.models.user_models import LogInRequest, SignUpRequest

auth_blueprint = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_blueprint.post("/signup")
def sign_up():
    sign_up_data = SignUpRequest.model_validate(request.get_json(silent=True) or {})
    auth_response = get_auth_service().sign_up(sign_up_data)
    return jsonify(auth_response.model_dump(mode="json")), 201


@auth_blueprint.post("/login")
def log_in():
    log_in_data = LogInRequest.model_validate(request.get_json(silent=True) or {})
    auth_response = get_auth_service().log_in(log_in_data)
    return jsonify(auth_response.model_dump(mode="json"))


@auth_blueprint.get("/me")
@require_authentication
def get_current_user():
    return jsonify(g.current_user.model_dump(mode="json"))
