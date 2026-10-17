from functools import wraps

from flask import g, request

from server.dependencies import get_auth_service
from server.errors import UnauthorizedError


def read_bearer_token() -> str:
    authorization_header = request.headers.get("Authorization", "")
    scheme, _, access_token = authorization_header.partition(" ")
    if scheme.lower() != "bearer" or not access_token:
        raise UnauthorizedError("Missing bearer token")
    return access_token


def require_authentication(route_function):
    @wraps(route_function)
    def authenticated_route(*args, **kwargs):
        g.current_user = get_auth_service().get_user_from_token(read_bearer_token())
        return route_function(*args, **kwargs)

    return authenticated_route
