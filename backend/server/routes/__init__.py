from flask import Flask

from server.routes.auth_routes import auth_blueprint
from server.routes.health_routes import health_blueprint
from server.routes.root_routes import root_blueprint


def register_routes(application: Flask) -> None:
    application.register_blueprint(root_blueprint)
    application.register_blueprint(health_blueprint)
    application.register_blueprint(auth_blueprint)
