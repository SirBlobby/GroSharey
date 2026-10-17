import os
from dataclasses import dataclass, field

from dotenv import load_dotenv

load_dotenv()


def read_allowed_origins() -> list[str]:
    raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:8081")
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "GroSharey API")
    environment: str = os.getenv("ENVIRONMENT", "development")
    allowed_origins: list[str] = field(default_factory=read_allowed_origins)


settings = Settings()
