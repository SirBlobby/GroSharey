from flask import Blueprint, g, jsonify, request

from server.authentication import require_authentication
from server.dependencies import get_audit_log_service
from server.models.audit_models import AuditLogQuery

audit_blueprint = Blueprint("audit", __name__, url_prefix="/api/audit-log")


@audit_blueprint.get("")
@require_authentication
def list_audit_events():
    audit_log_query = AuditLogQuery.model_validate(request.args.to_dict())
    audit_log_page = get_audit_log_service().list_events(g.current_user.id, audit_log_query)
    return jsonify(audit_log_page.model_dump(mode="json"))
