import { notFound } from "next/navigation";

import MovieCard from "@/components/MovieCard";
import UserSelector from "@/components/UserSelector";
import { getRecommendations, getUser, getUsers } from "@/lib/api";

export default async function UserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const userIdNum = Number(userId);

  if (!Number.isInteger(userIdNum)) {
    notFound();
  }

  const [{ items: users }, profile, recommendations] = await Promise.all([
    getUsers(),
    getUser(userIdNum).catch(() => null),
    getRecommendations(userIdNum, 10).catch(() => null),
  ]);

  if (!profile) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">
          Profil de l&apos;utilisateur #{profile.userId}
        </h1>
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <Stat label="Nombre de notes" value={profile.nRatings.toString()} />
          <Stat label="Note moyenne" value={profile.avgRating.toFixed(2)} />
          <Stat label="Genre préféré" value={profile.topGenre ?? "—"} />
        </div>
        <UserSelector users={users} selectedUserId={profile.userId} />
      </section>

      {profile.topMovies.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
            Films préférés de l&apos;utilisateur (historique)
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {profile.topMovies.map((movie) => (
              <MovieCard key={movie.movieId} movie={movie} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
          Recommandations LightGCN personnalisées
        </h2>
        {recommendations && recommendations.recommendations.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {recommendations.recommendations.map((movie) => (
              <MovieCard key={movie.movieId} movie={movie} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aucune recommandation disponible pour cet utilisateur.
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800">
      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{value}</p>
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
