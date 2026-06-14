"""Client minimal pour l'API TMDb (The Movie Database), utilisé pour récupérer les affiches."""

from urllib.parse import quote

import requests

TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

# Affiche de remplacement pour les films absents de TMDb (et de toute autre base
# d'images publique) : un visuel généré à la volée avec le titre du film, dans le
# style sombre de l'interface.
PLACEHOLDER_BASE_URL = "https://placehold.co/500x750/1e293b/f8fafc"


def placeholder_poster_url(title):
    """Retourne une URL d'affiche générique (texte = titre du film)."""
    return f"{PLACEHOLDER_BASE_URL}?text={quote(title)}"


def fetch_poster_url(tmdb_id, api_key, timeout=10):
    """Retourne l'URL complète de l'affiche d'un film à partir de son identifiant TMDb.

    Renvoie `None` si le film n'existe pas (ex: `tmdb_id` obsolète), n'a pas d'affiche,
    ou en cas d'erreur réseau.
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


def find_poster_by_imdb_id(imdb_id, api_key, timeout=10):
    """Recherche une affiche sur TMDb à partir d'un identifiant IMDb (`tt` + `imdb_id`).

    Sert de repli lorsque le `tmdb_id` fourni par MovieLens est obsolète ou absent :
    TMDb réassigne parfois les identifiants de films, mais l'identifiant IMDb reste stable.
    Retourne un tuple `(tmdb_id, poster_url)` ; `tmdb_id` vaut `None` si seule une fiche
    série TV a été trouvée (l'identifiant n'est alors pas un identifiant de film valide).
    Retourne `(None, None)` si rien n'est trouvé.
    """
    if not imdb_id or not api_key:
        return None, None

    try:
        response = requests.get(
            f"{TMDB_BASE_URL}/find/tt{imdb_id}",
            params={"api_key": api_key, "external_source": "imdb_id"},
            timeout=timeout,
        )
        if response.status_code != 200:
            return None, None

        data = response.json()
        for movie in data.get("movie_results", []):
            if movie.get("poster_path"):
                return movie["id"], f"{TMDB_IMAGE_BASE_URL}{movie['poster_path']}"

        for show in data.get("tv_results", []):
            if show.get("poster_path"):
                return None, f"{TMDB_IMAGE_BASE_URL}{show['poster_path']}"

        return None, None
    except requests.RequestException:
        return None, None
