from flask import Flask, jsonify
from pydantic import ValidationError

from server.errors import (
    BadRequestError,
    ConflictError,
    ExternalServiceError,
    NotFoundError,
    RateLimitError,
    UnauthorizedError,
)


def format_validation_message(error: ValidationError) -> str:
    messages = []
    for error_detail in error.errors():
        field_name = ".".join(str(location_part) for location_part in error_detail["loc"])
        messages.append(f"{field_name}: {error_detail['msg']}")
    return "; ".join(messages)


def handle_bad_request(error: BadRequestError):
    return jsonify({"detail": str(error)}), 400


def handle_not_found(error: NotFoundError):
    return jsonify({"detail": str(error)}), 404


def handle_unauthorized(error: UnauthorizedError):
    return jsonify({"detail": str(error)}), 401


def handle_conflict(error: ConflictError):
    return jsonify({"detail": str(error)}), 409


def handle_rate_limit(error: RateLimitError):
    return jsonify({"detail": str(error)}), 429


def handle_external_service_error(error: ExternalServiceError):
    return jsonify({"detail": str(error)}), 502


def handle_validation_error(error: ValidationError):
    return jsonify({"detail": format_validation_message(error)}), 400


def register_error_handlers(application: Flask) -> None:
    application.register_error_handler(BadRequestError, handle_bad_request)
    application.register_error_handler(NotFoundError, handle_not_found)
    application.register_error_handler(UnauthorizedError, handle_unauthorized)
    application.register_error_handler(ConflictError, handle_conflict)
    application.register_error_handler(RateLimitError, handle_rate_limit)
    application.register_error_handler(ExternalServiceError, handle_external_service_error)
    application.register_error_handler(ValidationError, handle_validation_error)
