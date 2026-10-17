from flask import Flask
from flask_cors import CORS

from server.config import settings
from server.error_handlers import register_error_handlers
from server.routes import register_routes


def create_app() -> Flask:
    application = Flask(__name__)
    CORS(application, origins=settings.allowed_origins)
    register_routes(application)
    register_error_handlers(application)
    return application


app = create_app()
