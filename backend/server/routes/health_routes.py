from flask import Blueprint, jsonify

from server.config import settings

health_blueprint = Blueprint("health", __name__, url_prefix="/api/health")


@health_blueprint.get("")
def get_health_status():
    return jsonify({"status": "ok", "environment": settings.environment})
