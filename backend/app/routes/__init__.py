"""Enregistrement de tous les blueprints de l'API."""

from .health import health_bp
from .movies import movies_bp
from .users import users_bp


def register_routes(app):
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(movies_bp, url_prefix="/api")
    app.register_blueprint(users_bp, url_prefix="/api")
