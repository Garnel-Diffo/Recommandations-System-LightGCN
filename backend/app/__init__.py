"""Fabrique de l'application Flask (application factory)."""

import os

from flask import Flask, jsonify
from flask_cors import CORS

from .config import config_by_name
from .extensions import db
from .routes import register_routes
from .services.recommender import Recommender


def create_app(env=None):
    env = env or os.environ.get("FLASK_ENV", "production")
    app = Flask(__name__)
    app.config.from_object(config_by_name.get(env, config_by_name["production"]))

    # Extensions
    db.init_app(app)
    CORS(app, origins=app.config["CORS_ORIGINS"])

    # Chargement des embeddings LightGCN (artefacts exportés par le notebook)
    app.recommender = Recommender(app.config["MODEL_ARTIFACTS_DIR"])

    # Routes
    register_routes(app)

    @app.route("/")
    def index():
        return jsonify({
            "name": "Recommandations-System-LightGCN API",
            "description": "API Flask de recommandation de films basée sur LightGCN",
            "endpoints": [
                "/api/health",
                "/api/movies",
                "/api/movies/<movie_id>",
                "/api/movies/<movie_id>/similar",
                "/api/movies/genres",
                "/api/users",
                "/api/users/<user_id>",
                "/api/users/<user_id>/recommendations",
            ],
        })

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"error": "Ressource non trouvée"}), 404

    @app.errorhandler(500)
    def server_error(_error):
        return jsonify({"error": "Erreur interne du serveur"}), 500

    return app
