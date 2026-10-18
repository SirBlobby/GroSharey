import logging

import httpx

from server.errors import ExternalServiceError, RateLimitError

logger = logging.getLogger(__name__)

ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"
REQUEST_TIMEOUT_SECONDS = 30
FREE_PLAN_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"
AUDIO_FILE_EXTENSIONS = {
    "audio/webm": "webm",
    "audio/mp4": "m4a",
    "audio/m4a": "m4a",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
}


class PaidVoiceError(ExternalServiceError):
    pass


class ElevenLabsClient:
    def __init__(self, api_key: str, voice_id: str, speech_model: str, transcription_model: str):
        self.api_key = api_key
        self.voice_id = voice_id
        self.speech_model = speech_model
        self.transcription_model = transcription_model

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def send(self, path: str, **request_options) -> httpx.Response:
        try:
            response = httpx.post(
                f"{ELEVENLABS_API_URL}{path}",
                headers={"xi-api-key": self.api_key},
                timeout=REQUEST_TIMEOUT_SECONDS,
                **request_options,
            )
        except httpx.HTTPError:
            logger.exception("ElevenLabs request to %s failed", path)
            raise ExternalServiceError("The voice service couldn't be reached. Try again.")
        if response.status_code == 429:
            raise RateLimitError("The voice service is busy. Try again in a minute.")
        if response.status_code == 402:
            logger.warning("ElevenLabs %s needs a paid plan: %s", path, response.text[:300])
            raise PaidVoiceError("This voice needs a paid ElevenLabs plan.")
        if response.status_code >= 400:
            logger.error("ElevenLabs %s returned %s: %s", path, response.status_code, response.text[:300])
            raise ExternalServiceError("The voice service couldn't handle that. Try again.")
        return response

    def transcribe(self, audio_bytes: bytes, mime_type: str) -> str:
        base_mime_type = mime_type.split(";")[0].strip().lower()
        file_name = f"voice.{AUDIO_FILE_EXTENSIONS.get(base_mime_type, 'webm')}"
        response = self.send(
            "/speech-to-text",
            data={"model_id": self.transcription_model},
            files={"file": (file_name, audio_bytes, base_mime_type)},
        )
        return str(response.json().get("text", "")).strip()

    def request_speech(self, text: str, voice_id: str) -> bytes:
        response = self.send(
            f"/text-to-speech/{voice_id}",
            params={"output_format": "mp3_44100_128"},
            json={"text": text, "model_id": self.speech_model},
        )
        return response.content

    def synthesize(self, text: str) -> bytes:
        try:
            return self.request_speech(text, self.voice_id)
        except PaidVoiceError:
            if self.voice_id == FREE_PLAN_VOICE_ID:
                raise
            logger.warning(
                "ElevenLabs voice %s needs a paid plan, switching to the free voice %s",
                self.voice_id,
                FREE_PLAN_VOICE_ID,
            )
            self.voice_id = FREE_PLAN_VOICE_ID
            return self.request_speech(text, self.voice_id)
