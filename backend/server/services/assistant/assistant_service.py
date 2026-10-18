import base64
import binascii
import logging
from datetime import datetime, timezone

from google.genai import types

from server.errors import BadRequestError
from server.models.assistant_models import AssistantReply, AssistantRequest
from server.models.user_models import User
from server.services.assistant.assistant_context import AssistantContext, AssistantServices
from server.services.assistant.assistant_tools import FUNCTION_DECLARATIONS, AssistantTools
from server.services.elevenlabs_client import ElevenLabsClient
from server.services.gemini_client import GeminiClient, GeminiErrorMessages

logger = logging.getLogger(__name__)

MAX_TOOL_ROUNDS = 6
GEMINI_AUDIO_TYPES = {"audio/webm": "audio/webm", "audio/mp4": "audio/aac", "audio/m4a": "audio/aac"}

ASSISTANT_ERROR_MESSAGES = GeminiErrorMessages(
    not_configured="The voice assistant is not configured on the server",
    rate_limited="The assistant is getting a lot of questions. Try again in a minute.",
    failed="The assistant couldn't answer right now. Try again.",
    busy="The assistant is busy right now. Try again in a few minutes.",
)


def build_assistant_prompt(user: User) -> str:
    today = datetime.now(timezone.utc).strftime("%A, %B %d, %Y")
    return f"""You are the voice assistant in groSharey, an app roommates use to share grocery \
lists and split grocery bills. You are talking to {user.display_name} (@{user.username}). Today is {today}.

- You can do almost anything in the app with your tools: add, cross off, put back, or remove list \
items; make or delete lists; check the pantry, mark pantry items running low, or mark them used up; \
see, make, and change groups, their members, and budgets; start or end a shopping trip; check balances, \
recent grocery runs, and pending payments; confirm or record payments; dispute an item on a split; and \
list or add friends. Always use a tool. Never guess amounts, items, or names.
- Do every part of a request. "Add milk and eggs for Sam" is one add_list_items call with two items. \
Put who an item is for in for_person when they say "for Sam" or "Sam wants". Leave it empty for the speaker.
- "We're out of milk" or "running low on eggs" means mark_pantry_running_low. If the item isn't in the \
pantry, add it to the list instead.
- When a tool says it needs confirmation, ask the speaker a short yes or no question. Only call it again \
with confirmed true after they say yes.
- When the list, group, or person isn't clear, ask one short question. When a tool returns an error, \
explain it simply or ask a short follow-up question.
- Your reply is shown on screen and read out loud. Answer in one or two short, friendly sentences \
with no lists, markdown, or emojis. Write money like "$12.50".
- Only talk about groceries, shopping lists, groups, splits, payments, and balances."""


def decode_audio(audio_base64: str) -> bytes:
    try:
        return base64.b64decode(audio_base64, validate=True)
    except (binascii.Error, ValueError):
        raise BadRequestError("That recording couldn't be read. Try again.")


class AssistantService:
    def __init__(
        self,
        gemini_client: GeminiClient,
        elevenlabs_client: ElevenLabsClient,
        assistant_services: AssistantServices,
    ):
        self.gemini_client = gemini_client
        self.elevenlabs_client = elevenlabs_client
        if not elevenlabs_client.is_configured():
            logger.warning("ELEVENLABS_API_KEY is not set, so Gemini listens and the browser voice replies")
        self.assistant_services = assistant_services

    def reply(self, assistant_request: AssistantRequest, user: User) -> AssistantReply:
        heard, question_part = self.read_question(assistant_request)
        tools = AssistantTools(AssistantContext(user=user, services=self.assistant_services))
        contents = [
            types.Content(
                role="user" if turn.role == "user" else "model", parts=[types.Part.from_text(text=turn.text)]
            )
            for turn in assistant_request.history
        ]
        contents.append(types.Content(role="user", parts=[question_part]))
        reply_text = self.run_conversation(contents, tools, user)
        audio_base64 = self.speak(reply_text) if assistant_request.wants_audio else None
        return AssistantReply(
            heard=heard, reply=reply_text, audio_base64=audio_base64, changed_data=tools.changed_data
        )

    def read_question(self, assistant_request: AssistantRequest) -> tuple[str | None, types.Part]:
        if not assistant_request.audio_base64:
            question = (assistant_request.text or "").strip()
            return question, types.Part.from_text(text=question)
        audio_bytes = decode_audio(assistant_request.audio_base64)
        if self.elevenlabs_client.is_configured():
            heard = self.elevenlabs_client.transcribe(audio_bytes, assistant_request.mime_type)
            if not heard:
                raise BadRequestError("I didn't catch that. Try saying it again.")
            return heard, types.Part.from_text(text=heard)
        base_mime_type = assistant_request.mime_type.split(";")[0].strip().lower()
        gemini_mime_type = GEMINI_AUDIO_TYPES.get(base_mime_type, base_mime_type)
        return None, types.Part.from_bytes(data=audio_bytes, mime_type=gemini_mime_type)

    def run_conversation(self, contents: list[types.Content], tools: AssistantTools, user: User) -> str:
        config = types.GenerateContentConfig(
            system_instruction=build_assistant_prompt(user),
            tools=[types.Tool(function_declarations=FUNCTION_DECLARATIONS)],
        )
        for _ in range(MAX_TOOL_ROUNDS):
            response = self.gemini_client.generate(
                contents, config, ASSISTANT_ERROR_MESSAGES, fall_back_when_rate_limited=True
            )
            function_calls = response.function_calls or []
            if not function_calls:
                return (response.text or "").strip() or "Sorry, I didn't get that. Can you say it another way?"
            contents.append(response.candidates[0].content)
            tool_results = [
                types.Part.from_function_response(
                    name=function_call.name,
                    response=tools.run(function_call.name, dict(function_call.args or {})),
                )
                for function_call in function_calls
            ]
            contents.append(types.Content(role="user", parts=tool_results))
        return "That took more steps than I can handle. Try asking one thing at a time."

    def speak(self, reply_text: str) -> str | None:
        if not self.elevenlabs_client.is_configured():
            return None
        try:
            return base64.b64encode(self.elevenlabs_client.synthesize(reply_text)).decode("ascii")
        except Exception:
            logger.exception("Could not turn the assistant reply into speech")
            return None
