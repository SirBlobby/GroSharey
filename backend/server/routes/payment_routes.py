from flask import Blueprint, g, jsonify, request

from server.authentication import require_authentication
from server.dependencies import get_payment_service
from server.models.payment_models import RecordPaymentRequest

payment_blueprint = Blueprint("payments", __name__, url_prefix="/api/payments")


@payment_blueprint.post("")
@require_authentication
def record_payment():
    payment_request = RecordPaymentRequest.model_validate(request.get_json(silent=True) or {})
    payment = get_payment_service().record_payment(g.current_user, payment_request)
    return jsonify(payment.model_dump(mode="json")), 201


@payment_blueprint.get("")
@require_authentication
def list_payments():
    payments = get_payment_service().list_payments(g.current_user.id)
    return jsonify([payment.model_dump(mode="json") for payment in payments])


@payment_blueprint.get("/pending")
@require_authentication
def list_pending_payments():
    payments = get_payment_service().list_pending_payments(g.current_user.id)
    return jsonify([payment.model_dump(mode="json") for payment in payments])


@payment_blueprint.post("/<payment_id>/confirm")
@require_authentication
def confirm_payment(payment_id: str):
    payment = get_payment_service().confirm_payment(payment_id, g.current_user)
    return jsonify(payment.model_dump(mode="json"))
