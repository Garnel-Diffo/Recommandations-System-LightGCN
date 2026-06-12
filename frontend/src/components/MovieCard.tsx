import Image from "next/image";
import Link from "next/link";

import type { Movie } from "@/lib/api";

interface MovieCardProps {
  movie: Movie & { score?: number; similarity?: number };
}

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link
      href={`/movies/${movie.movieId}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="relative aspect-[2/3] w-full bg-slate-100 dark:bg-slate-800">
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={`Affiche de ${movie.title}`}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 180px"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-3 text-center text-sm text-slate-400">
            {movie.title}
          </div>
        )}
        {typeof movie.score === "number" && (
          <span className="absolute right-2 top-2 rounded-full bg-indigo-600/90 px-2 py-0.5 text-xs font-semibold text-white shadow">
            {movie.score.toFixed(2)}
          </span>
        )}
        {typeof movie.similarity === "number" && (
          <span className="absolute right-2 top-2 rounded-full bg-emerald-600/90 px-2 py-0.5 text-xs font-semibold text-white shadow">
            {Math.round(movie.similarity * 100)}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {movie.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{movie.year ?? "—"}</p>
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {movie.genres.slice(0, 3).map((genre) => (
            <span
              key={genre}
              className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
