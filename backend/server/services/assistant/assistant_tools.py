import logging

from pydantic import ValidationError

from server.errors import BadRequestError, ConflictError, NotFoundError
from server.services.assistant.assistant_context import AssistantContext
from server.services.assistant.group_tools import GROUP_TOOL_DECLARATIONS, GroupTools
from server.services.assistant.list_tools import LIST_TOOL_DECLARATIONS, ListTools
from server.services.assistant.money_tools import MONEY_TOOL_DECLARATIONS, MoneyTools

logger = logging.getLogger(__name__)

FUNCTION_DECLARATIONS = LIST_TOOL_DECLARATIONS + GROUP_TOOL_DECLARATIONS + MONEY_TOOL_DECLARATIONS


class AssistantTools:
    def __init__(self, context: AssistantContext):
        self.context = context
        tool_groups = (ListTools(context), GroupTools(context), MoneyTools(context))
        self.tool_functions = {
            declaration["name"]: getattr(tool_group, declaration["name"])
            for tool_group in tool_groups
            for declaration in FUNCTION_DECLARATIONS
            if hasattr(tool_group, declaration["name"])
        }

    @property
    def changed_data(self) -> bool:
        return self.context.changed_data

    def run(self, function_name: str, arguments: dict) -> dict:
        tool_function = self.tool_functions.get(function_name)
        if tool_function is None:
            return {"error": f"Unknown tool {function_name}"}
        try:
            return tool_function(**arguments)
        except (BadRequestError, NotFoundError, ConflictError) as error:
            return {"error": str(error)}
        except (TypeError, ValidationError) as error:
            logger.warning("Assistant tool %s got bad arguments %s: %s", function_name, arguments, error)
            return {"error": "Those details didn't fit. Ask the speaker to say it another way."}
