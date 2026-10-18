from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

MAX_AUDIO_BASE64_LENGTH = 4_000_000
MAX_HISTORY_TURNS = 12


class AssistantTurn(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(max_length=2000)


class AssistantRequest(BaseModel):
    audio_base64: str | None = Field(default=None, max_length=MAX_AUDIO_BASE64_LENGTH)
    mime_type: str = Field(default="audio/webm", max_length=60)
    text: str | None = Field(default=None, max_length=500)
    history: list[AssistantTurn] = Field(default_factory=list)
    wants_audio: bool = True

    @field_validator("history")
    @classmethod
    def keep_recent_history(cls, history: list[AssistantTurn]) -> list[AssistantTurn]:
        return history[-MAX_HISTORY_TURNS:]

    @model_validator(mode="after")
    def require_audio_or_text(self) -> "AssistantRequest":
        if not self.audio_base64 and not (self.text and self.text.strip()):
            raise ValueError("Say or type something for the assistant")
        return self


class AssistantReply(BaseModel):
    heard: str | None
    reply: str
    audio_base64: str | None
    changed_data: bool
