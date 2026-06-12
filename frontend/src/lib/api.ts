// Client API minimal pour communiquer avec le backend Flask (LightGCN).

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export interface Movie {
  movieId: number;
  title: string;
  year: number | null;
  genres: string[];
  imdbId: string | null;
  tmdbId: number | null;
  posterUrl: string | null;
}

export interface MovieWithScore extends Movie {
  score?: number;
}

export interface MovieWithSimilarity extends Movie {
  similarity?: number;
}

export interface DemoUser {
  userId: number;
  nRatings: number;
  avgRating: number;
  topGenre: string | null;
  topMovieIds: number[];
}

export interface UserProfile extends DemoUser {
  topMovies: Movie[];
}

export interface PaginatedMovies {
  items: Movie[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

async function apiFetch<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`Erreur API (${res.status}) sur ${path}`);
  }

  return res.json() as Promise<T>;
}

export function getUsers() {
  return apiFetch<{ items: DemoUser[] }>("/api/users", 3600);
}

export function getUser(userId: number) {
  return apiFetch<UserProfile>(`/api/users/${userId}`, 3600);
}

export function getRecommendations(userId: number, k = 10) {
  return apiFetch<{ userId: number; user: DemoUser; recommendations: MovieWithScore[] }>(
    `/api/users/${userId}/recommendations?k=${k}`,
    60
  );
}

export function getMovies(params: { search?: string; genre?: string; page?: number; perPage?: number } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.genre) query.set("genre", params.genre);
  if (params.page) query.set("page", String(params.page));
  if (params.perPage) query.set("perPage", String(params.perPage));

  const qs = query.toString();
  return apiFetch<PaginatedMovies>(`/api/movies${qs ? `?${qs}` : ""}`, 300);
}

export function getGenres() {
  return apiFetch<{ genres: string[] }>("/api/movies/genres", 3600);
}

export function getMovie(movieId: number) {
  return apiFetch<Movie>(`/api/movies/${movieId}`, 300);
}

export function getSimilarMovies(movieId: number, k = 10) {
  return apiFetch<{ movie: Movie; similar: MovieWithSimilarity[] }>(
    `/api/movies/${movieId}/similar?k=${k}`,
    300
  );
}
