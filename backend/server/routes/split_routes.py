from flask import Blueprint, Response, g, jsonify, request

from server.authentication import require_authentication
from server.dependencies import get_split_dispute_service, get_split_report_service, get_split_service
from server.models.dispute_models import CreateDisputeRequest, ResolveDisputeRequest
from server.models.report_models import SplitReportQuery
from server.models.split_models import SplitRequest

split_blueprint = Blueprint("splits", __name__, url_prefix="/api/splits")


@split_blueprint.post("")
@require_authentication
def save_split():
    split_request = SplitRequest.model_validate(request.get_json(silent=True) or {})
    saved_split = get_split_service().save_split(split_request, g.current_user)
    return jsonify(saved_split.model_dump(mode="json")), 201


@split_blueprint.get("")
@require_authentication
def list_splits():
    splits = get_split_service().list_splits(g.current_user.id)
    return jsonify([split.model_dump(mode="json") for split in splits])


@split_blueprint.post("/<split_id>/disputes")
@require_authentication
def dispute_split_item(split_id: str):
    dispute_request = CreateDisputeRequest.model_validate(request.get_json(silent=True) or {})
    saved_split = get_split_dispute_service().dispute_item(split_id, dispute_request, g.current_user)
    return jsonify(saved_split.model_dump(mode="json")), 201


@split_blueprint.patch("/<split_id>/disputes/<dispute_id>")
@require_authentication
def resolve_split_dispute(split_id: str, dispute_id: str):
    resolve_request = ResolveDisputeRequest.model_validate(request.get_json(silent=True) or {})
    saved_split = get_split_dispute_service().resolve_dispute(split_id, dispute_id, resolve_request, g.current_user)
    return jsonify(saved_split.model_dump(mode="json"))


@split_blueprint.get("/report.pdf")
@require_authentication
def export_split_report():
    report_query = SplitReportQuery.model_validate(request.args.to_dict())
    pdf_bytes = get_split_report_service().export_pdf(report_query, g.current_user)
    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="grosharey-{report_query.month}.pdf"'},
    )
