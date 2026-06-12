"""Configuration de l'application Flask, chargée depuis les variables d'environnement."""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


class Config:
    """Configuration commune à tous les environnements."""

    # Base de données PostgreSQL (Neon)
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "")
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
    }
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # TMDb (affiches des films)
    TMDB_API_KEY = os.environ.get("TMDB_API_KEY", "")
    TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

    # Artefacts du modèle LightGCN (embeddings exportés par le notebook)
    MODEL_ARTIFACTS_DIR = os.environ.get(
        "MODEL_ARTIFACTS_DIR", str(BASE_DIR / "model_artifacts")
    )

    # Origines autorisées pour le frontend (CORS), séparées par des virgules
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")

    # Nombre de recommandations par défaut
    DEFAULT_TOP_K = int(os.environ.get("DEFAULT_TOP_K", "10"))
    MAX_TOP_K = int(os.environ.get("MAX_TOP_K", "50"))


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}
