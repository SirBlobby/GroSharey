import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

USERNAME_PATTERN = re.compile(r"^[a-z0-9_]{3,30}$")


class SignUpRequest(BaseModel):
    email: EmailStr
    username: str
    display_name: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username", mode="before")
    @classmethod
    def validate_username(cls, username: object) -> str:
        normalized_username = str(username).strip().lower()
        if not USERNAME_PATTERN.match(normalized_username):
            raise ValueError("Username must be 3 to 30 characters using letters, numbers, or underscores")
        return normalized_username

    @field_validator("display_name", mode="before")
    @classmethod
    def strip_display_name(cls, display_name: object) -> str:
        return str(display_name).strip()


class LogInRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class StoredUser(BaseModel):
    id: str
    email: str
    username: str
    display_name: str
    password_hash: str
    created_at: datetime
    profile_picture_version: int | None = None
    venmo_username: str | None = None
    paypal_username: str | None = None


class PublicProfile(BaseModel):
    id: str
    username: str
    display_name: str
    profile_picture_url: str | None = None


class User(PublicProfile):
    email: str
    created_at: datetime
    venmo_username: str | None = None
    paypal_username: str | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User
