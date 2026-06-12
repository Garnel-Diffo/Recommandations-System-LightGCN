"""Client minimal pour l'API TMDb (The Movie Database), utilisé pour récupérer les affiches."""

import requests

TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"


def fetch_poster_url(tmdb_id, api_key, timeout=10):
    """Retourne l'URL complète de l'affiche d'un film à partir de son identifiant TMDb.

    Renvoie `None` si le film n'existe pas, n'a pas d'affiche, ou en cas d'erreur réseau.
    """
    if not tmdb_id or not api_key:
        return None

    try:
        response = requests.get(
            f"{TMDB_BASE_URL}/movie/{int(tmdb_id)}",
            params={"api_key": api_key},
            timeout=timeout,
        )
        if response.status_code != 200:
            return None

        poster_path = response.json().get("poster_path")
        if not poster_path:
            return None

        return f"{TMDB_IMAGE_BASE_URL}{poster_path}"
    except requests.RequestException:
        return None
