# Recommandations-System — LightGCN sur MovieLens

Système de recommandation de films de bout en bout, basé sur **LightGCN** (réseau de neurones
convolutif de graphes) entraîné sur le jeu de données **MovieLens (ml-latest-small)**.

Le projet est composé de trois parties :

- **`notebook/`** — Analyse, prétraitement, modélisation, entraînement (BPR), évaluation
  (Recall@K / NDCG@K) et export des artefacts du modèle.
- **`backend/`** — API REST Flask (déployée sur Render) qui sert les recommandations à partir
  des embeddings exportés, avec catalogue de films et utilisateurs de démonstration stockés
  dans PostgreSQL (Neon).
- **`frontend/`** — Application web Next.js (déployée sur Vercel) consommant l'API.

---

## Sommaire

1. [Architecture générale](#1-architecture-générale)
2. [Prérequis](#2-prérequis)
3. [Le notebook LightGCN](#3-le-notebook-lightgcn)
   - [3.1 Structure du notebook](#31-structure-du-notebook)
   - [3.2 Dataset](#32-dataset)
   - [3.3 Résultats obtenus](#33-résultats-obtenus)
   - [3.4 Artefacts exportés](#34-artefacts-exportés)
4. [Backend Flask](#4-backend-flask)
   - [4.1 Architecture du backend](#41-architecture-du-backend)
   - [4.2 Modèle de données PostgreSQL](#42-modèle-de-données-postgresql)
   - [4.3 Configuration locale (.env)](#43-configuration-locale-env)
   - [4.4 Installation et lancement local](#44-installation-et-lancement-local)
   - [4.5 Peuplement de la base de données](#45-peuplement-de-la-base-de-données)
   - [4.6 Endpoints de l'API](#46-endpoints-de-lapi)
5. [Frontend Next.js](#5-frontend-nextjs)
   - [5.1 Configuration locale (.env)](#51-configuration-locale-env)
   - [5.2 Installation et lancement local](#52-installation-et-lancement-local)
   - [5.3 Pages de l'application](#53-pages-de-lapplication)
6. [Test complet en local](#6-test-complet-en-local)
7. [Déploiement](#7-déploiement)
   - [7.1 Préparer le dépôt GitHub](#71-préparer-le-dépôt-github)
   - [7.2 Déployer le backend sur Render](#72-déployer-le-backend-sur-render)
   - [7.3 Déployer le frontend sur Vercel](#73-déployer-le-frontend-sur-vercel)
   - [7.4 Obtenir une clé API TMDb (affiches)](#74-obtenir-une-clé-api-tmdb-affiches)
8. [Limitations et pistes d'amélioration](#8-limitations-et-pistes-damélioration)

---

## 1. Architecture générale

```
                ┌─────────────────────┐
                │   notebook/          │
                │   (entraînement      │
                │    LightGCN, PyTorch)│
                └──────────┬───────────┘
                            │ export (.npy, .json, .csv)
                            ▼
┌──────────────────────────────────────────┐        ┌───────────────────────────┐
│  backend/ (Flask, Render)                 │◄──────►│  PostgreSQL (Neon)        │
│  - charge les embeddings en mémoire       │        │  - movies (métadonnées +  │
│  - calcule les recommandations à la volée │        │    URL affiche TMDb)      │
│  - API REST JSON                          │        │  - demo_users (résumés)   │
└──────────────────┬─────────────────────────┘        └───────────────────────────┘
                   │ HTTP / JSON
                   ▼
┌──────────────────────────────────────────┐
│  frontend/ (Next.js, Vercel)              │
│  - catalogue de films, recherche, filtres │
│  - profils utilisateurs de démonstration  │
│  - recommandations personnalisées         │
│  - films similaires (embeddings)          │
└──────────────────────────────────────────┘
```

Le jeu de données brut (ratings) **n'est jamais stocké en base** : seules les métadonnées des
films (titre, année, genres, URL d'affiche TMDb) et un résumé agrégé par utilisateur de
démonstration (nombre de notes, note moyenne, genre préféré, films préférés) sont conservés
dans PostgreSQL. Les recommandations sont calculées à partir des **embeddings finaux du modèle
LightGCN**, exportés une fois pour toutes par le notebook (pas besoin de PyTorch en production).

---

## 2. Prérequis

- **Python 3.12+** (notebook et backend)
- **Node.js 20+** et npm (frontend)
- Un compte [Neon](https://neon.tech) (PostgreSQL géré, gratuit) — la chaîne de connexion est
  déjà fournie dans `backend/.env`
- (Optionnel mais recommandé) Une clé API [TMDb](https://www.themoviedb.org/settings/api)
  gratuite pour récupérer les affiches des films — voir [7.4](#74-obtenir-une-clé-api-tmdb-affiches)

---

## 3. Le notebook LightGCN

Dossier : [`notebook/`](notebook/)

- `build_notebook.py` : script générateur du notebook (toutes les cellules sont écrites en
  français, commentaires inclus).
- `lightgcn_movielens.ipynb` : notebook exécuté, prêt à être ouvert dans Jupyter.
- `data/ml-latest-small/` : jeu de données MovieLens téléchargé localement.
- `models/` : artefacts exportés après entraînement (copiés dans `backend/model_artifacts/`).

### 3.1 Structure du notebook

Le notebook suit les phases classiques d'un projet de Machine Learning :

1. Importation des bibliothèques et configuration (graines aléatoires, device, hyperparamètres)
2. Chargement des données MovieLens
3. Analyse exploratoire des données (EDA) — distributions des notes, popularité des films,
   activité des utilisateurs, genres
4. Prétraitement — encodage des identifiants utilisateurs/articles, split train/val/test
   stratifié par utilisateur (70/10/20)
5. Construction du graphe biparti utilisateur-article (matrice d'adjacence normalisée
   symétriquement $D^{-1/2} A D^{-1/2}$)
6. Implémentation du modèle **LightGCN** (propagation par couches, combinaison par moyenne)
7. Fonction de perte **BPR** (Bayesian Personalized Ranking) avec échantillonnage négatif et
   régularisation L2
8. Métriques d'évaluation **Recall@K** et **NDCG@K** (protocole "all-ranking")
9. Recherche des meilleurs hyperparamètres (grid search sur la dimension d'embedding et le
   nombre de couches)
10. Entraînement du modèle final avec arrêt précoce (early stopping)
11. Évaluation finale et comparaison avec une baseline de popularité
12. Analyse des embeddings appris (visualisation, similarité)
13. Génération de recommandations Top-K (exemples)
14. Export des artefacts pour le déploiement
15. Conclusion

Le **déploiement n'est volontairement pas traité dans le notebook** : il est entièrement géré
par le backend Flask, qui charge les artefacts exportés (étape 14).

### 3.2 Dataset

[MovieLens ml-latest-small](https://grouplens.org/datasets/movielens/) :
- 100 836 notes
- 610 utilisateurs
- 9 742 films (9 724 films notés, utilisés pour le graphe et les embeddings)

Les fichiers sont déjà téléchargés dans `notebook/data/ml-latest-small/`.

### 3.3 Résultats obtenus

Meilleure configuration retenue (grid search) : **embedding_dim = 64, n_layers = 2**.

| Métrique     | LightGCN | Baseline (popularité) |
|--------------|----------|------------------------|
| Recall@10    | 0.1089   | 0.0706                 |
| NDCG@10      | 0.2306   | 0.1762                 |
| Recall@20    | 0.1703   | 0.1164                 |
| NDCG@20      | 0.2291   | 0.1719                 |

LightGCN surpasse nettement la baseline de popularité sur toutes les métriques.

### 3.4 Artefacts exportés

Dans `notebook/models/` (et copiés dans `backend/model_artifacts/`) :

- `user_embeddings.npy`, `item_embeddings.npy` — embeddings finaux (NumPy, `float32`)
- `mappings.json` — correspondances entre identifiants MovieLens et indices internes
- `movies_metadata.csv` — métadonnées légères des films (titre, genres, identifiants TMDb/IMDb)
- `model_state.pt` — poids PyTorch du modèle (pour ré-entraînement éventuel)
- `eval_metrics.json` — hyperparamètres retenus et métriques finales

---

## 4. Backend Flask

Dossier : [`backend/`](backend/)

### 4.1 Architecture du backend

```
backend/
├── app/
│   ├── __init__.py        # create_app() : factory Flask
│   ├── config.py           # configuration (variables d'environnement)
│   ├── extensions.py        # instance SQLAlchemy
│   ├── models.py            # modèles Movie, DemoUser
│   ├── routes/
│   │   ├── health.py         # GET /api/health
│   │   ├── movies.py          # GET /api/movies, /api/movies/<id>, /api/movies/<id>/similar
│   │   └── users.py            # GET /api/users, /api/users/<id>, /api/users/<id>/recommendations
│   └── services/
│       ├── recommender.py     # chargement des embeddings + calcul des recommandations
│       └── tmdb.py             # récupération des URL d'affiches via l'API TMDb
├── scripts/
│   └── populate_db.py        # peuplement ponctuel de la base Neon
├── model_artifacts/           # embeddings et métadonnées exportés par le notebook
├── wsgi.py                     # point d'entrée Gunicorn / Flask
├── Procfile                     # commande de démarrage pour Render
├── requirements.txt             # dépendances de production
├── requirements-scripts.txt      # + pandas, pour les scripts ponctuels uniquement
├── .env                           # configuration locale (non versionné)
└── .env.example                   # modèle de configuration
```

Le `Recommender` (`app/services/recommender.py`) charge les embeddings `.npy` et `mappings.json`
en mémoire au démarrage de l'application — aucune dépendance à PyTorch n'est nécessaire en
production.

### 4.2 Modèle de données PostgreSQL

Deux tables, volontairement minimalistes (le dataset complet n'est jamais stocké) :

- **`movies`** : `movie_id`, `item_index` (indice dans les embeddings), `title`, `year`,
  `genres`, `imdb_id`, `tmdb_id`, `poster_url` (URL TMDb uniquement, pas l'image)
- **`demo_users`** : `user_id`, `user_index`, `n_ratings`, `avg_rating`, `top_genre`,
  `top_movie_ids` (résumé agrégé pour la démo, calculé une fois à partir du dataset MovieLens)

### 4.3 Configuration locale (.env)

Le fichier `backend/.env` (déjà créé, non versionné) contient :

```env
FLASK_ENV=development
DATABASE_URL=postgresql://neondb_owner:npg_5TtqD7UyOQxg@ep-rough-queen-asehowo6.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require
TMDB_API_KEY=
CORS_ORIGINS=http://localhost:3000
PORT=5000
DEFAULT_TOP_K=10
MAX_TOP_K=50
```

Un modèle est disponible dans `backend/.env.example`. `TMDB_API_KEY` est vide pour l'instant
(voir [7.4](#74-obtenir-une-clé-api-tmdb-affiches)) — sans clé, les films sont affichés sans
affiche (`posterUrl: null`), le reste de l'application fonctionne normalement.

### 4.4 Installation et lancement local

```bash
cd backend
python -m venv .venv

# Windows
./.venv/Scripts/python.exe -m pip install -r requirements.txt
./.venv/Scripts/python.exe wsgi.py

# macOS / Linux
source .venv/bin/activate
pip install -r requirements.txt
python wsgi.py
```

L'API démarre sur **http://localhost:5000**. Vérification rapide :

```bash
curl http://localhost:5000/api/health
```

### 4.5 Peuplement de la base de données

À exécuter **une seule fois** (déjà fait pour la base Neon fournie, mais nécessaire si vous
recréez votre propre base ou ré-entraînez le modèle) :

```bash
cd backend
./.venv/Scripts/python.exe -m pip install -r requirements-scripts.txt
./.venv/Scripts/python.exe -m scripts.populate_db
```

Ce script :
1. Crée les tables `movies` et `demo_users` (si absentes).
2. Insère les 9 724 films ayant un embedding (avec affiche TMDb si `TMDB_API_KEY` est définie).
3. Calcule et insère les résumés des 610 utilisateurs de démonstration à partir du dataset
   MovieLens local (le dataset lui-même n'est jamais stocké en base).

> Le script peut prendre **plusieurs dizaines de minutes** la première fois (un aller-retour
> réseau vers Neon par film). Les exécutions suivantes sont quasi instantanées (les lignes
> existantes sont ignorées).

### 4.6 Endpoints de l'API

Toutes les routes sont préfixées par `/api`.

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/health` | État de l'API et informations sur le modèle chargé |
| GET | `/api/movies` | Liste paginée des films (`search`, `genre`, `page`, `perPage`) |
| GET | `/api/movies/genres` | Liste de tous les genres disponibles |
| GET | `/api/movies/<movie_id>` | Détails d'un film |
| GET | `/api/movies/<movie_id>/similar` | Films similaires (similarité cosinus des embeddings, `k`) |
| GET | `/api/users` | Liste des utilisateurs de démonstration |
| GET | `/api/users/<user_id>` | Profil d'un utilisateur (statistiques + films préférés) |
| GET | `/api/users/<user_id>/recommendations` | Recommandations LightGCN personnalisées (`k`) |

---

## 5. Frontend Next.js

Dossier : [`frontend/`](frontend/)

Application Next.js 16 (App Router, TypeScript, Tailwind CSS v4, React 19), entièrement en
Server Components pour la récupération des données.

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              # accueil
│   │   ├── movies/page.tsx        # catalogue (recherche, filtres, pagination)
│   │   ├── movies/[movieId]/page.tsx  # détail d'un film + films similaires
│   │   └── users/[userId]/page.tsx     # profil utilisateur + recommandations
│   ├── components/                # Navbar, Footer, MovieCard, UserSelector, ...
│   └── lib/api.ts                  # client API (fetch vers le backend Flask)
├── next.config.ts                   # autorise les images distantes TMDb
├── .env.local                        # configuration locale (non versionné)
└── .env.example                       # modèle de configuration
```

### 5.1 Configuration locale (.env)

`frontend/.env.local` (déjà créé, non versionné) :

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 5.2 Installation et lancement local

```bash
cd frontend
npm install
npm run dev
```

L'application démarre sur **http://localhost:3000**.

### 5.3 Pages de l'application

- **`/`** — Accueil, présentation du projet, sélection d'un utilisateur de démonstration
- **`/movies`** — Catalogue des films (recherche par titre, filtre par genre, pagination)
- **`/movies/[movieId]`** — Détail d'un film + films similaires (embeddings LightGCN)
- **`/users/[userId]`** — Profil d'un utilisateur de démonstration : statistiques, films
  préférés (historique), recommandations personnalisées

---

## 6. Test complet en local

1. Démarrer le backend (port 5000) — voir [4.4](#44-installation-et-lancement-local)
2. Démarrer le frontend (port 3000) — voir [5.2](#52-installation-et-lancement-local)
3. Ouvrir **http://localhost:3000** :
   - La page d'accueil doit afficher la liste des utilisateurs de démonstration.
   - `/movies` doit afficher le catalogue paginé, avec recherche et filtre par genre fonctionnels.
   - Cliquer sur un film doit afficher sa page de détail avec des films similaires.
   - Choisir un utilisateur doit afficher son profil avec ses films préférés et ses
     recommandations personnalisées.

✅ Ce parcours a été testé de bout en bout avec la base Neon fournie (9 724 films, 610
utilisateurs) : tous les endpoints API et toutes les pages répondent correctement (codes 200,
404 géré pour les ressources inexistantes).

---

## 7. Déploiement

> Tout a été testé en local et fonctionne. Les étapes ci-dessous sont à exécuter **par vous**,
> dans l'ordre, après avoir poussé le code sur GitHub.

### 7.1 Préparer le dépôt GitHub

```bash
cd Recommandations-System
git init
git add .
git commit -m "Initial commit: Recommandations-System (LightGCN)"
git branch -M main
git remote add origin <URL_DE_VOTRE_DEPOT_GITHUB>
git push -u origin main
```

Le `.gitignore` exclut déjà : `.venv/`, `node_modules/`, `.env*` (sauf `.env.example`),
`notebook/data/`, les fichiers `.next/`, etc.

### 7.2 Déployer le backend sur Render

1. Sur [Render](https://render.com), créer un **New > Web Service**, connecter votre dépôt
   GitHub et sélectionner le dossier racine **`backend`** (Root Directory : `backend`).
2. Configuration du service :
   - **Runtime** : Python 3
   - **Build Command** : `pip install -r requirements.txt`
   - **Start Command** : `gunicorn wsgi:app` (déjà défini dans `backend/Procfile`)
3. Ajouter les **variables d'environnement** (Environment) suivantes (copier les valeurs de
   `backend/.env`) :
   - `FLASK_ENV` = `production`
   - `DATABASE_URL` = `postgresql://neondb_owner:npg_5TtqD7UyOQxg@ep-rough-queen-asehowo6.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require`
   - `TMDB_API_KEY` = *(votre clé TMDb, voir 7.4)*
   - `CORS_ORIGINS` = *(URL Vercel de votre frontend, ex : `https://recommandations-system.vercel.app`)*
   - `DEFAULT_TOP_K` = `10`
   - `MAX_TOP_K` = `50`
4. Déployer. Une fois le service en ligne, vérifier `https://<votre-service>.onrender.com/api/health`.
5. La base Neon est déjà peuplée — aucune action supplémentaire n'est nécessaire. Si vous
   recréez une base, exécutez `populate_db.py` en local en pointant `DATABASE_URL` vers la
   nouvelle base, **avant** ou après le déploiement (le script peut être lancé depuis votre
   machine, il n'a pas besoin d'être exécuté sur Render).

### 7.3 Déployer le frontend sur Vercel

1. Sur [Vercel](https://vercel.com), **Add New > Project**, importer le même dépôt GitHub et
   définir le **Root Directory** sur `frontend`.
2. Vercel détecte automatiquement Next.js (build : `next build`, output : `.next`).
3. Ajouter la variable d'environnement :
   - `NEXT_PUBLIC_API_URL` = `https://<votre-service>.onrender.com` (URL du backend Render,
     **sans** slash final)
4. Déployer. Une fois en ligne, vérifier que `/`, `/movies`, `/movies/[id]`, `/users/[id]`
   fonctionnent.
5. **Important** : revenir sur Render et mettre à jour `CORS_ORIGINS` avec l'URL Vercel finale
   (ex : `https://recommandations-system.vercel.app`), puis redéployer le backend.

### 7.4 Obtenir une clé API TMDb (affiches)

Les affiches des films sont **optionnelles** — sans clé, l'application fonctionne normalement
(les cartes de films affichent le titre à la place de l'affiche).

Pour les activer :
1. Créer un compte gratuit sur [themoviedb.org](https://www.themoviedb.org/)
2. Aller dans **Paramètres > API** et demander une clé API (v3 auth) — gratuite, instantanée
3. Renseigner `TMDB_API_KEY` dans `backend/.env` (local) et dans les variables d'environnement
   Render (production)
4. Relancer `python -m scripts.populate_db` (en local, pointant vers la base Neon) pour
   récupérer et enregistrer les URL d'affiches manquantes — le script ignore les films déjà
   en base sans réessayer leur affiche ; pour forcer la mise à jour, supprimer les lignes
   concernées ou adapter le script.

---

## 8. Limitations et pistes d'amélioration

- Les recommandations et similarités sont calculées **à la volée** à partir des embeddings
  finaux figés (pas de ré-entraînement en ligne).
- Les utilisateurs de démonstration sont ceux du dataset MovieLens (610 profils synthétiques),
  il n'y a pas de système d'authentification ni de nouveaux utilisateurs.
- 18 films du catalogue MovieLens sans aucune note n'ont pas d'embedding et ne sont donc pas
  inclus dans la base (9 724 / 9 742 films).
- Pour ré-entraîner le modèle avec de nouvelles données : relancer `notebook/build_notebook.py`
  puis le notebook, copier les nouveaux artefacts dans `backend/model_artifacts/`, et relancer
  `populate_db.py`.
