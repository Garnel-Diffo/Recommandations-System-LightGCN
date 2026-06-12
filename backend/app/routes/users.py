"""Endpoints relatifs aux utilisateurs de démonstration et à leurs recommandations."""

from flask import Blueprint, current_app, jsonify, request

from ..models import DemoUser, Movie

users_bp = Blueprint("users", __name__)


@users_bp.route("/users", methods=["GET"])
def list_users():
    """Liste des utilisateurs de démonstration disponibles (pour le sélecteur de profil)."""
    users = DemoUser.query.order_by(DemoUser.user_id.asc()).all()
    return jsonify({"items": [u.to_dict() for u in users]})


@users_bp.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user = DemoUser.query.get_or_404(user_id)
    payload = user.to_dict()

    if payload["topMovieIds"]:
        movies = Movie.query.filter(Movie.movie_id.in_(payload["topMovieIds"])).all()
        movies_by_id = {m.movie_id: m.to_dict() for m in movies}
        payload["topMovies"] = [
            movies_by_id[mid] for mid in payload["topMovieIds"] if mid in movies_by_id
        ]
    else:
        payload["topMovies"] = []

    return jsonify(payload)


@users_bp.route("/users/<int:user_id>/recommendations", methods=["GET"])
def get_recommendations(user_id):
    """Top-K recommandations LightGCN pour un utilisateur de démonstration."""
    recommender = current_app.recommender
    default_k = current_app.config["DEFAULT_TOP_K"]
    max_k = current_app.config["MAX_TOP_K"]
    k = min(max_k, max(1, request.args.get("k", default_k, type=int)))

    user = DemoUser.query.get_or_404(user_id)

    if not recommender.has_user(user_id):
        return jsonify({"userId": user_id, "recommendations": []})

    recommendations = recommender.recommend_for_user(user_id, k=k)
    movie_ids = [item["movieId"] for item in recommendations]
    movies_by_id = {m.movie_id: m for m in Movie.query.filter(Movie.movie_id.in_(movie_ids)).all()}

    results = []
    for item in recommendations:
        movie = movies_by_id.get(item["movieId"])
        if movie is None:
            continue
        results.append({**movie.to_dict(), "score": round(item["score"], 4)})

    return jsonify({"userId": user_id, "user": user.to_dict(), "recommendations": results})
