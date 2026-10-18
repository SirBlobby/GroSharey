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
                "profile": "GET /api/profiles/<username>",
                "profile_picture": "GET /api/profiles/<username>/picture",
                "upload_profile_picture": "PUT /api/profiles/me/picture",
                "parse_receipt": "POST /api/receipts/parse",
                "preview_split": "POST /api/receipts/split",
                "list_friends": "GET /api/friends",
                "add_friend": "POST /api/friends",
                "remove_friend": "DELETE /api/friends/<username>",
                "save_split": "POST /api/splits",
                "list_splits": "GET /api/splits",
                "record_payment": "POST /api/payments",
                "list_payments": "GET /api/payments",
                "update_payment_handles": "PUT /api/profiles/me/payment-handles",
            },
        }
    )
