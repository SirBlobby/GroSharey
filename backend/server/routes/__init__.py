from flask import Flask

from server.routes.health_routes import health_blueprint


def register_routes(application: Flask) -> None:
    application.register_blueprint(health_blueprint)
