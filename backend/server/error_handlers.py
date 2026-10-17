from flask import Flask, jsonify
from pydantic import ValidationError

from server.errors import NotFoundError


def handle_not_found(error: NotFoundError):
    return jsonify({"detail": str(error)}), 404


def handle_validation_error(error: ValidationError):
    return jsonify({"detail": error.errors(include_url=False)}), 400


def register_error_handlers(application: Flask) -> None:
    application.register_error_handler(NotFoundError, handle_not_found)
    application.register_error_handler(ValidationError, handle_validation_error)
