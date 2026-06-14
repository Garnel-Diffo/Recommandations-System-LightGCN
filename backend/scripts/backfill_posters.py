"""Récupère les affiches TMDb manquantes pour les films déjà présents en base.

À exécuter après avoir renseigné `TMDB_API_KEY` dans `backend/.env`, si
`scripts/populate_db.py` a déjà été lancé sans cette clé (les films ont alors été
insérés avec `poster_url = NULL`), ou pour corriger les `tmdb_id` devenus obsolètes
(TMDb réassigne parfois ses identifiants).

Pour chaque film sans affiche :
1. Si `tmdb_id` est présent, tente `/movie/{tmdb_id}`.
2. En cas d'échec (id obsolète) ou si `tmdb_id` est absent, recherche via
   `/find/tt{imdb_id}` (identifiant IMDb stable) et corrige `tmdb_id` si une fiche
   film valide est trouvée.
3. Si TMDb ne fournit toujours aucune affiche (fiche série TV, ou film totalement
   absent de TMDb), utilise une affiche de remplacement générée (titre du film).

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
from app.services.tmdb import (  # noqa: E402
    fetch_poster_url,
    find_poster_by_imdb_id,
    placeholder_poster_url,
)

TMDB_API_KEY = os.environ.get("TMDB_API_KEY", "")
MAX_WORKERS = int(os.environ.get("TMDB_MAX_WORKERS", "10"))


def main():
    if not TMDB_API_KEY:
        print("ERREUR : TMDB_API_KEY non définie dans backend/.env.")
        sys.exit(1)

    app = create_app(os.environ.get("FLASK_ENV", "development"))
    with app.app_context():
        movies = Movie.query.filter(Movie.poster_url.is_(None)).all()
        movie_data = [(m.movie_id, m.title, m.imdb_id, m.tmdb_id) for m in movies]
        print(f"Films sans affiche à traiter : {len(movie_data)}")

        def resolve(movie_id, title, imdb_id, tmdb_id):
            poster_url = fetch_poster_url(tmdb_id, TMDB_API_KEY)
            new_tmdb_id = None
            if not poster_url:
                found_tmdb_id, poster_url = find_poster_by_imdb_id(imdb_id, TMDB_API_KEY)
                if found_tmdb_id:
                    new_tmdb_id = found_tmdb_id
            if not poster_url:
                poster_url = placeholder_poster_url(title)
            return movie_id, new_tmdb_id, poster_url

        updated = 0
        found = 0
        placeholders = 0
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = [executor.submit(resolve, *data) for data in movie_data]
            for future in as_completed(futures):
                movie_id, new_tmdb_id, poster_url = future.result()
                values = {"poster_url": poster_url}
                if new_tmdb_id:
                    values["tmdb_id"] = new_tmdb_id
                Movie.query.filter_by(movie_id=movie_id).update(values)

                if poster_url.startswith("https://placehold.co/"):
                    placeholders += 1
                else:
                    found += 1
                updated += 1
                if updated % 200 == 0:
                    db.session.commit()
                    print(f"  ... {updated}/{len(movie_data)} traités ({found} affiches TMDb trouvées)")

        db.session.commit()
        print(
            f"Terminé : {updated} films traités, {found} affiches TMDb trouvées, "
            f"{placeholders} affiches de remplacement utilisées."
        )


if __name__ == "__main__":
    main()
