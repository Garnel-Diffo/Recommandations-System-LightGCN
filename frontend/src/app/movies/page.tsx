import MovieCard from "@/components/MovieCard";
import MovieFilters from "@/components/MovieFilters";
import Pagination from "@/components/Pagination";
import { getGenres, getMovies } from "@/lib/api";

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const genre = typeof params.genre === "string" ? params.genre : "";
  const page = Number(params.page) || 1;

  const [{ items: movies, totalPages, totalItems }, { genres }] = await Promise.all([
    getMovies({ search, genre, page, perPage: 20 }),
    getGenres(),
  ]);

  function buildHref(targetPage: number) {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (genre) query.set("genre", genre);
    query.set("page", String(targetPage));
    return `/movies?${query.toString()}`;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Catalogue de films</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {totalItems.toLocaleString("fr-FR")} films issus de MovieLens (ml-latest-small)
        </p>
      </div>

      <div className="animate-fade-in-up delay-100">
        <MovieFilters genres={genres} />
      </div>

      {movies.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {movies.map((movie, i) => (
            <div
              key={movie.movieId}
              className="animate-scale-in"
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            >
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      ) : (
        <div className="animate-fade-in flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-700">
          <span className="text-3xl">🔍</span>
          <p className="text-sm text-slate-500 dark:text-slate-400">Aucun film trouvé.</p>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
    </div>
  );
}
