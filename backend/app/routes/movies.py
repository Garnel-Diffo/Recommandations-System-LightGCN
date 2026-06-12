"""Endpoints relatifs au catalogue de films : recherche, détails, films similaires."""

from flask import Blueprint, current_app, jsonify, request

from ..extensions import db
from ..models import Movie

movies_bp = Blueprint("movies", __name__)


@movies_bp.route("/movies", methods=["GET"])
def list_movies():
    """Liste paginée des films, avec recherche par titre et filtre par genre."""
    search = request.args.get("search", "", type=str).strip()
    genre = request.args.get("genre", "", type=str).strip()
    page = max(1, request.args.get("page", 1, type=int))
    per_page = min(50, max(1, request.args.get("perPage", 20, type=int)))

    query = Movie.query
    if search:
        query = query.filter(Movie.title.ilike(f"%{search}%"))
    if genre:
        query = query.filter(Movie.genres.ilike(f"%{genre}%"))

    query = query.order_by(Movie.title.asc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "items": [movie.to_dict() for movie in pagination.items],
        "page": pagination.page,
        "perPage": per_page,
        "totalItems": pagination.total,
        "totalPages": pagination.pages,
    })


@movies_bp.route("/movies/genres", methods=["GET"])
def list_genres():
    """Retourne la liste de tous les genres présents dans le catalogue."""
    rows = db.session.query(Movie.genres).distinct().all()
    genres = set()
    for (genres_str,) in rows:
        for g in genres_str.split("|"):
            if g and g != "(no genres listed)":
                genres.add(g)
    return jsonify({"genres": sorted(genres)})


@movies_bp.route("/movies/<int:movie_id>", methods=["GET"])
def get_movie(movie_id):
    movie = Movie.query.get_or_404(movie_id)
    return jsonify(movie.to_dict())


@movies_bp.route("/movies/<int:movie_id>/similar", methods=["GET"])
def similar_movies(movie_id):
    """Films les plus proches de `movie_id` dans l'espace des embeddings LightGCN."""
    recommender = current_app.recommender
    k = min(current_app.config["MAX_TOP_K"], request.args.get("k", 10, type=int))

    movie = Movie.query.get_or_404(movie_id)
    if not recommender.has_movie(movie_id):
        return jsonify({"movie": movie.to_dict(), "similar": []})

    similar = recommender.similar_movies(movie_id, k=k)
    similar_ids = [item["movieId"] for item in similar]
    movies_by_id = {m.movie_id: m for m in Movie.query.filter(Movie.movie_id.in_(similar_ids)).all()}

    results = []
    for item in similar:
        m = movies_by_id.get(item["movieId"])
        if m is None:
            continue
        results.append({**m.to_dict(), "similarity": round(item["similarity"], 4)})

    return jsonify({"movie": movie.to_dict(), "similar": results})
