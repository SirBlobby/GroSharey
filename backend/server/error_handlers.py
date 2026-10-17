from flask import Flask, jsonify
from pydantic import ValidationError

from server.errors import ConflictError, NotFoundError, UnauthorizedError


def format_validation_message(error: ValidationError) -> str:
    messages = []
    for error_detail in error.errors():
        field_name = ".".join(str(location_part) for location_part in error_detail["loc"])
        messages.append(f"{field_name}: {error_detail['msg']}")
    return "; ".join(messages)


def handle_not_found(error: NotFoundError):
    return jsonify({"detail": str(error)}), 404


def handle_unauthorized(error: UnauthorizedError):
    return jsonify({"detail": str(error)}), 401


def handle_conflict(error: ConflictError):
    return jsonify({"detail": str(error)}), 409


def handle_validation_error(error: ValidationError):
    return jsonify({"detail": format_validation_message(error)}), 400


def register_error_handlers(application: Flask) -> None:
    application.register_error_handler(NotFoundError, handle_not_found)
    application.register_error_handler(UnauthorizedError, handle_unauthorized)
    application.register_error_handler(ConflictError, handle_conflict)
    application.register_error_handler(ValidationError, handle_validation_error)
