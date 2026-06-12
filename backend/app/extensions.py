"""Instances partagées des extensions Flask (évite les imports circulaires)."""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
