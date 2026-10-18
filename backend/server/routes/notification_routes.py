from flask import Blueprint, g, jsonify, request

from server.authentication import require_authentication
from server.dependencies import get_audit_log_service
from server.models.audit_models import MarkNotificationsReadRequest, NotificationQuery

notification_blueprint = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@notification_blueprint.get("")
@require_authentication
def list_notifications():
    notification_query = NotificationQuery.model_validate(request.args.to_dict())
    notification_page = get_audit_log_service().list_notifications(g.current_user.id, notification_query)
    return jsonify(notification_page.model_dump(mode="json"))


@notification_blueprint.post("/read")
@require_authentication
def mark_notifications_read():
    read_request = MarkNotificationsReadRequest.model_validate(request.get_json(silent=True) or {})
    get_audit_log_service().mark_notifications_read(g.current_user.id, read_request.notification_ids)
    return "", 204
