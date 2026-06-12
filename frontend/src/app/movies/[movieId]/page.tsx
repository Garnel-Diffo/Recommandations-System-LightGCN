import Image from "next/image";
import { notFound } from "next/navigation";

import MovieCard from "@/components/MovieCard";
import { getMovie, getSimilarMovies } from "@/lib/api";

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ movieId: string }>;
}) {
  const { movieId } = await params;
  const movieIdNum = Number(movieId);

  if (!Number.isInteger(movieIdNum)) {
    notFound();
  }

  const data = await getSimilarMovies(movieIdNum, 10).catch(() => null);
  const movie = data?.movie ?? (await getMovie(movieIdNum).catch(() => null));

  if (!movie) {
    notFound();
  }

  const similar = data?.similar ?? [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10">
      <section className="grid gap-6 sm:grid-cols-[220px_1fr]">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-100 shadow-sm dark:bg-slate-800">
          {movie.posterUrl ? (
            <Image
              src={movie.posterUrl}
              alt={`Affiche de ${movie.title}`}
              fill
              sizes="220px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-4 text-center text-slate-400">
              {movie.title}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{movie.title}</h1>
          {movie.year && <p className="mt-1 text-slate-500 dark:text-slate-400">{movie.year}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {movie.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
              >
                {genre}
              </span>
            ))}
          </div>
          {movie.imdbId && (
            <a
              href={`https://www.imdb.com/title/tt${movie.imdbId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Voir sur IMDb →
            </a>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
          Films similaires (embeddings LightGCN)
        </h2>
        {similar.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {similar.map((m) => (
              <MovieCard key={m.movieId} movie={m} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aucun film similaire disponible.
          </p>
        )}
      </section>
    </div>
  );
}
