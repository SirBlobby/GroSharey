from flask import Blueprint, Response, g, jsonify, request

from server.authentication import require_authentication
from server.dependencies import get_profile_service
from server.models.profile_picture_models import ProfilePictureUpload

profile_blueprint = Blueprint("profiles", __name__, url_prefix="/api/profiles")

ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365


@profile_blueprint.put("/me/picture")
@require_authentication
def upload_profile_picture():
    upload_data = ProfilePictureUpload.model_validate(request.get_json(silent=True) or {})
    updated_user = get_profile_service().upload_profile_picture(g.current_user.id, upload_data.image_base64)
    return jsonify(updated_user.model_dump(mode="json"))


@profile_blueprint.get("/<username>")
@require_authentication
def get_profile(username: str):
    profile = get_profile_service().get_profile_by_username(username)
    return jsonify(profile.model_dump(mode="json"))


@profile_blueprint.get("/<username>/picture")
def get_profile_picture(username: str):
    image_bytes, content_type = get_profile_service().get_profile_picture(username)
    picture_response = Response(image_bytes, mimetype=content_type)
    picture_response.headers["Cache-Control"] = f"public, max-age={ONE_YEAR_IN_SECONDS}, immutable"
    return picture_response
