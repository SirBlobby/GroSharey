import os
from dataclasses import dataclass, field

from dotenv import load_dotenv

load_dotenv()

DEVELOPMENT_JWT_SECRET_KEY = "development-only-secret-key-change-before-deploying"


def read_allowed_origins() -> list[str]:
    raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:8081")
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "GroSharey API")
    environment: str = os.getenv("ENVIRONMENT", "development")
    allowed_origins: list[str] = field(default_factory=read_allowed_origins)
    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    mongodb_database_name: str = os.getenv("MONGODB_DATABASE_NAME", "grosharey")
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", DEVELOPMENT_JWT_SECRET_KEY)
    jwt_expiration_minutes: int = int(os.getenv("JWT_EXPIRATION_MINUTES", "10080"))


def validate_settings(current_settings: Settings) -> None:
    is_production = current_settings.environment == "production"
    if is_production and current_settings.jwt_secret_key == DEVELOPMENT_JWT_SECRET_KEY:
        raise RuntimeError("JWT_SECRET_KEY must be set in production")


settings = Settings()
