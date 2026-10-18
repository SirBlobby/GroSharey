from flask import Blueprint, g, jsonify, request

from server.authentication import require_authentication
from server.dependencies import get_insights_service
from server.models.insights_models import RecapQuery

insights_blueprint = Blueprint("insights", __name__, url_prefix="/api/insights")


@insights_blueprint.get("/prices")
@require_authentication
def get_price_watch():
    price_watch = get_insights_service().build_price_watch(g.current_user)
    return jsonify(price_watch.model_dump(mode="json"))


@insights_blueprint.get("/recap")
@require_authentication
def get_yearly_recap():
    recap_query = RecapQuery.model_validate(request.args.to_dict())
    yearly_recap = get_insights_service().build_recap(recap_query, g.current_user)
    return jsonify(yearly_recap.model_dump(mode="json"))
