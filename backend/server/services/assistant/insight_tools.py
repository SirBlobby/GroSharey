from datetime import datetime, timezone

from server.models.insights_models import RecapQuery
from server.services.assistant.assistant_context import AssistantContext
from server.services.assistant.list_tools import declare
from server.services.assistant.name_matching import list_names_match, names_match, pick_one, remove_filler_words

INSIGHT_TOOL_DECLARATIONS = [
    declare(
        "get_price_watch",
        "Compares what the speaker paid for the same items at different stores, like where eggs are cheapest.",
        {"item_name": {"type": "string", "description": "One item to look up. Empty for the best savings."}},
    ),
    declare(
        "get_yearly_recap",
        "Gets a year in review: grocery runs, items bought, money spent, top items, stores, and shopping buddy.",
        {
            "year": {"type": "integer", "description": "Empty for this year"},
            "group_name": {"type": "string", "description": "Group name for a group's recap. Empty for the speaker."},
        },
    ),
]


class InsightTools:
    def __init__(self, context: AssistantContext):
        self.context = context
        self.user = context.user
        self.insights_service = context.services.insights_service

    def get_price_watch(self, item_name: str = "") -> dict:
        comparisons = self.insights_service.build_price_watch(self.user).comparisons
        if item_name.strip():
            comparisons = [comparison for comparison in comparisons if names_match(item_name, comparison.product)]
            if not comparisons:
                return {"result": f"There isn't enough price history for {item_name} yet. It needs two purchases."}
        return {
            "prices": [
                {
                    "item": comparison.product,
                    "cheapest": f"${comparison.cheapest_price:.2f} at {comparison.cheapest_store}",
                    "last_paid": f"${comparison.latest_price:.2f} at {comparison.latest_store}",
                    "tip": comparison.tip,
                }
                for comparison in comparisons[:6]
            ]
        }

    def get_yearly_recap(self, year: int = 0, group_name: str = "") -> dict:
        group_id = None
        if remove_filler_words(group_name):
            groups = self.context.services.group_service.list_groups(self.user)
            matches = [group for group in groups if list_names_match(group_name, group.name)]
            group_id = pick_one(matches, group_name, "group", [group.name for group in groups]).id
        recap_query = RecapQuery(year=year or datetime.now(timezone.utc).year, group_id=group_id)
        recap = self.insights_service.build_recap(recap_query, self.user)
        return recap.model_dump(mode="json")
