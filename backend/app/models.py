"""Modèles SQLAlchemy : uniquement les données nécessaires à l'application en ligne.

Conformément à la consigne, le dataset complet (100 000+ notes) n'est PAS stocké en base.
Seules les métadonnées des films (pour l'affichage) et un résumé des utilisateurs de
démonstration (pour le sélecteur de profil) sont persistés.
"""

from sqlalchemy.dialects.postgresql import ARRAY

from .extensions import db


class Movie(db.Model):
    """Métadonnées d'un film, enrichies de l'affiche TMDb."""

    __tablename__ = "movies"

    movie_id = db.Column(db.Integer, primary_key=True)  # movieId MovieLens
    item_index = db.Column(db.Integer, nullable=False, unique=True, index=True)  # index LightGCN
    title = db.Column(db.String(255), nullable=False)
    year = db.Column(db.Integer, nullable=True)
    genres = db.Column(db.String(255), nullable=False)
    imdb_id = db.Column(db.String(20), nullable=True)
    tmdb_id = db.Column(db.Integer, nullable=True)
    poster_url = db.Column(db.String(500), nullable=True)

    def to_dict(self):
        return {
            "movieId": self.movie_id,
            "title": self.title,
            "year": self.year,
            "genres": self.genres.split("|") if self.genres else [],
            "imdbId": self.imdb_id,
            "tmdbId": self.tmdb_id,
            "posterUrl": self.poster_url,
        }


class DemoUser(db.Model):
    """Résumé d'un utilisateur de démonstration issu du jeu de données MovieLens."""

    __tablename__ = "demo_users"

    user_id = db.Column(db.Integer, primary_key=True)  # userId MovieLens
    user_index = db.Column(db.Integer, nullable=False, unique=True, index=True)  # index LightGCN
    n_ratings = db.Column(db.Integer, nullable=False)
    avg_rating = db.Column(db.Float, nullable=False)
    top_genre = db.Column(db.String(50), nullable=True)
    # Identifiants (movieId) des films les mieux notés par l'utilisateur (top 5 max)
    top_movie_ids = db.Column(ARRAY(db.Integer), nullable=False, default=list)

    def to_dict(self):
        return {
            "userId": self.user_id,
            "nRatings": self.n_ratings,
            "avgRating": round(self.avg_rating, 2),
            "topGenre": self.top_genre,
            "topMovieIds": self.top_movie_ids or [],
        }
