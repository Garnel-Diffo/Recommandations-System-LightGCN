"""Service de recommandation : charge les embeddings LightGCN pré-entraînés et calcule
les scores de préférence (produit scalaire) pour générer des recommandations Top-K.

Ce service ne dépend ni du dataset complet, ni de PyTorch : les embeddings finaux ont été
exportés par le notebook sous forme de tableaux NumPy, ce qui rend le service de
recommandation très léger et rapide (calcul vectoriel pur NumPy).
"""

import json
import os

import numpy as np


class Recommender:
    """Encapsule les embeddings utilisateurs/articles et les correspondances d'identifiants."""

    def __init__(self, artifacts_dir):
        self.artifacts_dir = artifacts_dir

        self.user_embeddings = np.load(os.path.join(artifacts_dir, "user_embeddings.npy"))
        self.item_embeddings = np.load(os.path.join(artifacts_dir, "item_embeddings.npy"))

        with open(os.path.join(artifacts_dir, "mappings.json"), "r", encoding="utf-8") as f:
            mappings = json.load(f)

        # Clés JSON toujours en str -> reconversion en int pour les identifiants MovieLens
        self.user2idx = {int(k): v for k, v in mappings["user2idx"].items()}
        self.item2idx = {int(k): v for k, v in mappings["item2idx"].items()}
        self.idx2user = {int(k): v for k, v in mappings["idx2user"].items()}
        self.idx2item = {int(k): v for k, v in mappings["idx2item"].items()}

        # Pré-calcul des normes pour la similarité cosinus entre articles
        norms = np.linalg.norm(self.item_embeddings, axis=1, keepdims=True)
        self._item_embeddings_normalized = self.item_embeddings / np.clip(norms, 1e-10, None)

    @property
    def n_users(self):
        return self.user_embeddings.shape[0]

    @property
    def n_items(self):
        return self.item_embeddings.shape[0]

    def has_user(self, user_id):
        return int(user_id) in self.user2idx

    def has_movie(self, movie_id):
        return int(movie_id) in self.item2idx

    def list_user_ids(self):
        return sorted(self.user2idx.keys())

    def recommend_for_user(self, user_id, k=10, exclude_movie_ids=None):
        """Retourne les `k` meilleurs movieId pour l'utilisateur `user_id`, avec leurs scores."""
        user_idx = self.user2idx[int(user_id)]
        scores = self.item_embeddings @ self.user_embeddings[user_idx]

        if exclude_movie_ids:
            for movie_id in exclude_movie_ids:
                item_idx = self.item2idx.get(int(movie_id))
                if item_idx is not None:
                    scores[item_idx] = -np.inf

        k = min(k, self.n_items)
        top_indices = np.argpartition(-scores, k - 1)[:k]
        top_indices = top_indices[np.argsort(-scores[top_indices])]

        return [
            {"movieId": self.idx2item[int(idx)], "score": float(scores[idx])}
            for idx in top_indices
        ]

    def similar_movies(self, movie_id, k=10):
        """Retourne les `k` films les plus proches de `movie_id` (similarité cosinus)."""
        item_idx = self.item2idx[int(movie_id)]
        sims = self._item_embeddings_normalized @ self._item_embeddings_normalized[item_idx]

        k = min(k + 1, self.n_items)  # +1 car le film lui-même sera exclu
        top_indices = np.argpartition(-sims, k - 1)[:k]
        top_indices = top_indices[np.argsort(-sims[top_indices])]
        top_indices = [idx for idx in top_indices if idx != item_idx][:k - 1]

        return [
            {"movieId": self.idx2item[int(idx)], "similarity": float(sims[idx])}
            for idx in top_indices
        ]
