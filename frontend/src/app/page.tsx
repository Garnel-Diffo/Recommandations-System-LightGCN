import Link from "next/link";

import UserSelector from "@/components/UserSelector";
import { getUsers } from "@/lib/api";

export default async function HomePage() {
  const { items: users } = await getUsers();

  return (
    <div className="relative overflow-hidden">
      {/* Decorative animated background blobs */}
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-indigo-400/30 blur-3xl dark:bg-indigo-500/20"
      />
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-500/10"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:py-16">
        <section className="animate-fade-in-up flex flex-col gap-4 text-center">
          <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
            Démo interactive · Graph Neural Network
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Recommandations de films par{" "}
            <span className="animate-gradient bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              graphe de neurones (LightGCN)
            </span>
          </h1>
          <p className="mx-auto max-w-3xl text-balance text-slate-600 dark:text-slate-300">
            Ce démonstrateur s&apos;appuie sur un modèle <strong>LightGCN</strong> entraîné en
            PyTorch sur le jeu de données <strong>MovieLens (ml-latest-small)</strong>. Le modèle
            représente les interactions utilisateur-film comme un graphe biparti et propage les
            embeddings sur plusieurs couches pour capturer des signaux collaboratifs riches.
          </p>
        </section>

        <section className="animate-fade-in-up delay-100 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80">
          <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
            Tester les recommandations personnalisées
          </h2>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Sélectionnez un utilisateur de démonstration parmi les{" "}
            <strong className="text-indigo-600 dark:text-indigo-400">{users.length}</strong> profils
            issus du jeu de données MovieLens pour découvrir ses recommandations Top-10 générées
            par le modèle.
          </p>
          <UserSelector users={users} />
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          <FeatureCard
            icon="🔗"
            delay="delay-100"
            title="Graphe biparti utilisateur-article"
            description="Les interactions (notes) sont modélisées comme un graphe biparti utilisateur-film, normalisé symétriquement pour la propagation des messages."
          />
          <FeatureCard
            icon="🧠"
            delay="delay-200"
            title="LightGCN + perte BPR"
            description="Les embeddings sont propagés sur plusieurs couches et combinés par moyenne, puis entraînés avec la perte Bayesian Personalized Ranking (BPR)."
          />
          <FeatureCard
            icon="📊"
            delay="delay-300"
            title="Évaluation Recall@K / NDCG@K"
            description="Le modèle est évalué selon le protocole de classement intégral (all-ranking) avec les métriques Recall@K et NDCG@K, surpassant une baseline de popularité."
          />
        </section>

        <section className="animate-fade-in-up delay-300 text-center">
          <Link
            href="/movies"
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40 active:translate-y-0"
          >
            Parcourir le catalogue de films
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </section>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className={`animate-fade-in-up ${delay} group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700`}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-xl transition-transform group-hover:scale-110 dark:bg-indigo-950">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}
