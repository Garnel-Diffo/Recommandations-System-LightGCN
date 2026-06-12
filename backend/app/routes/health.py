"""Endpoint de santé, utile pour Render et pour le frontend (vérification de connexion)."""

from flask import Blueprint, current_app, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health():
    recommender = current_app.recommender
    return jsonify({
        "status": "ok",
        "model": {
            "nUsers": recommender.n_users,
            "nItems": recommender.n_items,
            "embeddingDim": int(recommender.item_embeddings.shape[1]),
        },
    })
