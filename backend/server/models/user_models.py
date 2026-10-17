from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LogInRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class User(BaseModel):
    id: str
    email: str
    created_at: datetime


class StoredUser(User):
    password_hash: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User
