from flask import Blueprint, g, jsonify, request

from server.authentication import require_authentication
from server.dependencies import get_assistant_service
from server.models.assistant_models import AssistantRequest

assistant_blueprint = Blueprint("assistant", __name__, url_prefix="/api/assistant")


@assistant_blueprint.post("")
@require_authentication
def ask_assistant():
    assistant_request = AssistantRequest.model_validate(request.get_json(silent=True) or {})
    assistant_reply = get_assistant_service().reply(assistant_request, g.current_user)
    return jsonify(assistant_reply.model_dump(mode="json"))
