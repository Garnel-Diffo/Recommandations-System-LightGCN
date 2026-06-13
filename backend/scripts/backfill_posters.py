"""Récupère les affiches TMDb manquantes pour les films déjà présents en base.

À exécuter une fois après avoir renseigné `TMDB_API_KEY` dans `backend/.env`, si
`scripts/populate_db.py` a déjà été lancé sans cette clé (les films ont alors été
insérés avec `poster_url = NULL`).

Usage :
    python -m scripts.backfill_posters
"""

import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

from dotenv import load_dotenv

# Permet l'exécution directe du script (python scripts/backfill_posters.py)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

load_dotenv()

from app import create_app  # noqa: E402
from app.extensions import db  # noqa: E402
from app.models import Movie  # noqa: E402
from app.services.tmdb import fetch_poster_url  # noqa: E402

TMDB_API_KEY = os.environ.get("TMDB_API_KEY", "")
MAX_WORKERS = int(os.environ.get("TMDB_MAX_WORKERS", "10"))


def main():
    if not TMDB_API_KEY:
        print("ERREUR : TMDB_API_KEY non définie dans backend/.env.")
        sys.exit(1)

    app = create_app(os.environ.get("FLASK_ENV", "development"))
    with app.app_context():
        movies = (
            Movie.query.filter(Movie.tmdb_id.isnot(None), Movie.poster_url.is_(None)).all()
        )
        movie_data = [(m.movie_id, m.tmdb_id) for m in movies]
        print(f"Films sans affiche à traiter : {len(movie_data)}")

        def fetch_one(movie_id, tmdb_id):
            return movie_id, fetch_poster_url(tmdb_id, TMDB_API_KEY)

        updated = 0
        found = 0
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = [executor.submit(fetch_one, mid, tid) for mid, tid in movie_data]
            for future in as_completed(futures):
                movie_id, poster_url = future.result()
                if poster_url:
                    Movie.query.filter_by(movie_id=movie_id).update({"poster_url": poster_url})
                    found += 1
                updated += 1
                if updated % 200 == 0:
                    db.session.commit()
                    print(f"  ... {updated}/{len(movie_data)} traités ({found} affiches trouvées)")

        db.session.commit()
        print(f"Terminé : {updated} films traités, {found} affiches récupérées.")


if __name__ == "__main__":
    main()
