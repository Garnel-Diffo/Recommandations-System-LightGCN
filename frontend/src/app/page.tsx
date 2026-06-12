import Link from "next/link";

import UserSelector from "@/components/UserSelector";
import { getUsers } from "@/lib/api";

export default async function HomePage() {
  const { items: users } = await getUsers();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12">
      <section className="flex flex-col gap-4 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          Recommandations de films par{" "}
          <span className="text-indigo-600">graphe de neurones (LightGCN)</span>
        </h1>
        <p className="mx-auto max-w-3xl text-balance text-slate-600 dark:text-slate-300">
          Ce démonstrateur s&apos;appuie sur un modèle <strong>LightGCN</strong> entraîné en
          PyTorch sur le jeu de données <strong>MovieLens (ml-latest-small)</strong>. Le modèle
          représente les interactions utilisateur-film comme un graphe biparti et propage les
          embeddings sur plusieurs couches pour capturer des signaux collaboratifs riches.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
          Tester les recommandations personnalisées
        </h2>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
          Sélectionnez un utilisateur de démonstration parmi les {users.length} profils issus du
          jeu de données MovieLens pour découvrir ses recommandations Top-10 générées par le
          modèle.
        </p>
        <UserSelector users={users} />
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <FeatureCard
          title="Graphe biparti utilisateur-article"
          description="Les interactions (notes) sont modélisées comme un graphe biparti utilisateur-film, normalisé symétriquement pour la propagation des messages."
        />
        <FeatureCard
          title="LightGCN + perte BPR"
          description="Les embeddings sont propagés sur plusieurs couches et combinés par moyenne, puis entraînés avec la perte Bayesian Personalized Ranking (BPR)."
        />
        <FeatureCard
          title="Évaluation Recall@K / NDCG@K"
          description="Le modèle est évalué selon le protocole de classement intégral (all-ranking) avec les métriques Recall@K et NDCG@K, surpassant une baseline de popularité."
        />
      </section>

      <section className="text-center">
        <Link
          href="/movies"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-indigo-700"
        >
          Parcourir le catalogue de films →
        </Link>
      </section>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}
