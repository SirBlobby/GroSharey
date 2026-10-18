import logging
from dataclasses import dataclass

from google import genai
from google.genai import errors as gemini_errors
from google.genai import types

from server.errors import ExternalServiceError, RateLimitError

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class GeminiErrorMessages:
    not_configured: str
    rate_limited: str
    failed: str
    busy: str


class GeminiClient:
    def __init__(self, gemini_api_key: str, gemini_model: str, gemini_fallback_model: str):
        self.gemini_api_key = gemini_api_key
        # Free-tier quotas are per model, so the fallback draws on a separate allowance.
        self.gemini_models = list(dict.fromkeys(model for model in (gemini_model, gemini_fallback_model) if model))
        self.client: genai.Client | None = None

    def get_client(self, error_messages: GeminiErrorMessages) -> genai.Client:
        if not self.gemini_api_key:
            logger.error("GEMINI_API_KEY is not set")
            raise ExternalServiceError(error_messages.not_configured)
        if self.client is None:
            self.client = genai.Client(api_key=self.gemini_api_key)
        return self.client

    def generate(
        self,
        contents: list,
        config: types.GenerateContentConfig,
        error_messages: GeminiErrorMessages,
        fall_back_when_rate_limited: bool = False,
    ) -> types.GenerateContentResponse:
        """Tries each model once. Only moves on when Gemini is overloaded (5xx); rate limits
        and bad requests stop immediately so retries don't burn free-tier quota."""
        client = self.get_client(error_messages)
        was_rate_limited = False
        for model in self.gemini_models:
            try:
                return client.models.generate_content(model=model, contents=contents, config=config)
            except gemini_errors.ServerError as error:
                logger.warning("Gemini model %s unavailable (%s %s)", model, error.code, error.status)
            except gemini_errors.APIError as error:
                if error.code == 429 and fall_back_when_rate_limited:
                    logger.warning("Gemini model %s is rate limited, trying the next model", model)
                    was_rate_limited = True
                    continue
                if error.code == 429:
                    raise RateLimitError(error_messages.rate_limited)
                logger.exception("Gemini request to %s failed", model)
                raise ExternalServiceError(error_messages.failed)
        if was_rate_limited:
            raise RateLimitError(error_messages.rate_limited)
        raise ExternalServiceError(error_messages.busy)
