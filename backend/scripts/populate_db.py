"""Script de peuplement de la base PostgreSQL (Neon) à exécuter une seule fois (ou après
un ré-entraînement du modèle).

Ce script :
1. Crée les tables `movies` et `demo_users` si elles n'existent pas.
2. Charge les métadonnées des films exportées par le notebook (`model_artifacts/movies_metadata.csv`)
   et les correspondances d'identifiants (`model_artifacts/mappings.json`).
3. Récupère les affiches des films via l'API TMDb (en parallèle) et enregistre uniquement
   l'URL de l'affiche (pas l'image elle-même).
4. Calcule un résumé par utilisateur (nombre de notes, note moyenne, genre préféré, films
   préférés) à partir du dataset MovieLens local, **sans jamais stocker le dataset complet**.

Usage :
    python -m scripts.populate_db
"""

import json
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

import pandas as pd
from dotenv import load_dotenv

# Permet l'exécution directe du script (python scripts/populate_db.py)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

load_dotenv()

from app import create_app  # noqa: E402
from app.extensions import db  # noqa: E402
from app.models import DemoUser, Movie  # noqa: E402
from app.services.tmdb import fetch_poster_url  # noqa: E402

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "model_artifacts")
DATASET_DIR = os.path.join(
    os.path.dirname(__file__), "..", "..", "notebook", "data", "ml-latest-small"
)

YEAR_PATTERN = re.compile(r"\((\d{4})\)\s*$")
TMDB_API_KEY = os.environ.get("TMDB_API_KEY", "")
MAX_WORKERS = int(os.environ.get("TMDB_MAX_WORKERS", "10"))


def extract_year(title):
    match = YEAR_PATTERN.search(title)
    return int(match.group(1)) if match else None


def populate_movies(mappings):
    print("Chargement des métadonnées des films...")
    movies_df = pd.read_csv(os.path.join(ARTIFACTS_DIR, "movies_metadata.csv"))
    item2idx = mappings["item2idx"]

    # Seuls les films présents dans item2idx ont un embedding LightGCN (les films sans
    # aucune note du jeu d'entraînement sont ignorés, ils ne peuvent pas être recommandés).
    movies_df = movies_df[movies_df["movieId"].astype(str).isin(item2idx)]

    existing_ids = {m.movie_id for m in Movie.query.with_entities(Movie.movie_id).all()}
    rows_to_fetch = movies_df[~movies_df["movieId"].isin(existing_ids)]
    print(f"Films déjà en base : {len(existing_ids)} / Films à insérer : {len(rows_to_fetch)}")

    def fetch_one(row):
        tmdb_id = row["tmdbId"]
        poster_url = None
        if pd.notna(tmdb_id) and TMDB_API_KEY:
            poster_url = fetch_poster_url(int(tmdb_id), TMDB_API_KEY)
        return row, poster_url

    inserted = 0
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(fetch_one, row) for _, row in rows_to_fetch.iterrows()]
        for future in as_completed(futures):
            row, poster_url = future.result()
            movie_id = int(row["movieId"])
            movie = Movie(
                movie_id=movie_id,
                item_index=item2idx[str(movie_id)],
                title=row["title"],
                year=extract_year(row["title"]),
                genres=row["genres"],
                imdb_id=f"{int(row['imdbId']):07d}" if pd.notna(row["imdbId"]) else None,
                tmdb_id=int(row["tmdbId"]) if pd.notna(row["tmdbId"]) else None,
                poster_url=poster_url,
            )
            db.session.merge(movie)
            inserted += 1
            if inserted % 200 == 0:
                db.session.commit()
                print(f"  ... {inserted}/{len(rows_to_fetch)} films traités")

    db.session.commit()
    print(f"Films insérés/mis à jour : {inserted}")


def populate_demo_users(mappings):
    print("Calcul des statistiques des utilisateurs de démonstration...")
    ratings = pd.read_csv(os.path.join(DATASET_DIR, "ratings.csv"))
    movies = pd.read_csv(os.path.join(DATASET_DIR, "movies.csv"))
    user2idx = mappings["user2idx"]

    merged = ratings.merge(movies, on="movieId")
    merged_genres = merged.assign(genre=merged["genres"].str.split("|")).explode("genre")
    merged_genres = merged_genres[merged_genres["genre"] != "(no genres listed)"]

    top_genre_per_user = (
        merged_genres.groupby(["userId", "genre"]).size()
        .reset_index(name="count")
        .sort_values(["userId", "count"], ascending=[True, False])
        .groupby("userId").first()["genre"]
    )

    stats = ratings.groupby("userId").agg(n_ratings=("rating", "size"), avg_rating=("rating", "mean"))

    inserted = 0
    for user_id, row in stats.iterrows():
        top_movies = (
            ratings[ratings["userId"] == user_id]
            .sort_values(["rating", "timestamp"], ascending=[False, False])
            .head(5)["movieId"].tolist()
        )
        demo_user = DemoUser(
            user_id=int(user_id),
            user_index=user2idx[str(int(user_id))],
            n_ratings=int(row["n_ratings"]),
            avg_rating=float(row["avg_rating"]),
            top_genre=top_genre_per_user.get(user_id),
            top_movie_ids=top_movies,
        )
        db.session.merge(demo_user)
        inserted += 1

    db.session.commit()
    print(f"Utilisateurs de démonstration insérés/mis à jour : {inserted}")


def main():
    if not TMDB_API_KEY:
        print("ATTENTION : TMDB_API_KEY non définie. Les films seront insérés sans affiche.")

    app = create_app(os.environ.get("FLASK_ENV", "development"))
    with app.app_context():
        db.create_all()

        with open(os.path.join(ARTIFACTS_DIR, "mappings.json"), "r", encoding="utf-8") as f:
            mappings = json.load(f)

        populate_movies(mappings)
        populate_demo_users(mappings)

    print("Peuplement de la base de données terminé.")


if __name__ == "__main__":
    main()
