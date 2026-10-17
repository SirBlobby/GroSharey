from datetime import datetime, timedelta, timezone

import jwt

from server.config import settings
from server.errors import UnauthorizedError

TOKEN_ALGORITHM = "HS256"


def create_access_token(user_id: str) -> str:
    issued_at = datetime.now(timezone.utc)
    token_payload = {
        "sub": user_id,
        "iat": issued_at,
        "exp": issued_at + timedelta(minutes=settings.jwt_expiration_minutes),
    }
    return jwt.encode(token_payload, settings.jwt_secret_key, algorithm=TOKEN_ALGORITHM)


def read_user_id_from_token(access_token: str) -> str:
    try:
        token_payload = jwt.decode(access_token, settings.jwt_secret_key, algorithms=[TOKEN_ALGORITHM])
    except jwt.InvalidTokenError:
        raise UnauthorizedError("Invalid or expired token")
    return token_payload["sub"]
