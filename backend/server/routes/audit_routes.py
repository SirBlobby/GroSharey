from flask import Blueprint, g, jsonify

from server.authentication import require_authentication
from server.dependencies import get_audit_log_service

audit_blueprint = Blueprint("audit", __name__, url_prefix="/api/audit-log")


@audit_blueprint.get("")
@require_authentication
def list_audit_events():
    audit_events = get_audit_log_service().list_events(g.current_user.id)
    return jsonify([audit_event.model_dump(mode="json") for audit_event in audit_events])
