from flask import Blueprint, jsonify

from server.config import settings

root_blueprint = Blueprint("root", __name__)


@root_blueprint.get("/")
def get_api_overview():
    return jsonify(
        {
            "name": settings.app_name,
            "status": "running",
            "environment": settings.environment,
            "endpoints": {
                "health": "GET /api/health",
                "sign_up": "POST /api/auth/signup",
                "log_in": "POST /api/auth/login",
                "current_user": "GET /api/auth/me",
            },
        }
    )
