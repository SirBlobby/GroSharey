from flask import Flask

from server.routes.audit_routes import audit_blueprint
from server.routes.auth_routes import auth_blueprint
from server.routes.friend_routes import friend_blueprint
from server.routes.group_routes import group_blueprint
from server.routes.health_routes import health_blueprint
from server.routes.notification_routes import notification_blueprint
from server.routes.payment_routes import payment_blueprint
from server.routes.profile_routes import profile_blueprint
from server.routes.receipt_routes import receipt_blueprint
from server.routes.root_routes import root_blueprint
from server.routes.shopping_list_routes import shopping_list_blueprint
from server.routes.split_routes import split_blueprint


def register_routes(application: Flask) -> None:
    application.register_blueprint(root_blueprint)
    application.register_blueprint(health_blueprint)
    application.register_blueprint(auth_blueprint)
    application.register_blueprint(profile_blueprint)
    application.register_blueprint(receipt_blueprint)
    application.register_blueprint(friend_blueprint)
    application.register_blueprint(group_blueprint)
    application.register_blueprint(shopping_list_blueprint)
    application.register_blueprint(split_blueprint)
    application.register_blueprint(payment_blueprint)
    application.register_blueprint(audit_blueprint)
    application.register_blueprint(notification_blueprint)
