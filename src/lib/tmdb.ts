const BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w500';
export const TMDB_IMG_BASE_LARGE = 'https://image.tmdb.org/t/p/w780';

export interface TmdbResult {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  year: string;
  rating: number;
  overview: string;
  genres: string[];
}

interface GenreMap {
  movie: Map<number, string>;
  tv: Map<number, string>;
  fetchedAt: number;
}

// Module-level genre cache — refreshed every 24 hours
let genreCache: GenreMap | null = null;

class TmdbService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchApi<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.set('api_key', this.apiKey);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const res = await fetch(url.toString(), {
      next: { revalidate: 300 }, // 5-min cache for Next.js fetch
    });

    if (!res.ok) {
      throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  private async getGenres(): Promise<GenreMap> {
    const now = Date.now();
    if (genreCache && now - genreCache.fetchedAt < 24 * 60 * 60 * 1000) {
      return genreCache;
    }

    const [movieGenres, tvGenres] = await Promise.all([
      this.fetchApi<{ genres: { id: number; name: string }[] }>(
        '/genre/movie/list'
      ),
      this.fetchApi<{ genres: { id: number; name: string }[] }>(
        '/genre/tv/list'
      ),
    ]);

    genreCache = {
      movie: new Map(movieGenres.genres.map((g) => [g.id, g.name])),
      tv: new Map(tvGenres.genres.map((g) => [g.id, g.name])),
      fetchedAt: now,
    };

    return genreCache;
  }

  private mapMovie(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw: any,
    genreMap: Map<number, string>
  ): TmdbResult {
    return {
      tmdbId: raw.id,
      mediaType: 'movie',
      title: raw.title ?? raw.original_title ?? 'Unknown',
      posterPath: raw.poster_path ?? null,
      year: raw.release_date ? raw.release_date.slice(0, 4) : '',
      rating: raw.vote_average ?? 0,
      overview: raw.overview ?? '',
      genres: (raw.genre_ids ?? [])
        .map((id: number) => genreMap.get(id))
        .filter(Boolean) as string[],
    };
  }

  private mapTv(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw: any,
    genreMap: Map<number, string>
  ): TmdbResult {
    return {
      tmdbId: raw.id,
      mediaType: 'tv',
      title: raw.name ?? raw.original_name ?? 'Unknown',
      posterPath: raw.poster_path ?? null,
      year: raw.first_air_date ? raw.first_air_date.slice(0, 4) : '',
      rating: raw.vote_average ?? 0,
      overview: raw.overview ?? '',
      genres: (raw.genre_ids ?? [])
        .map((id: number) => genreMap.get(id))
        .filter(Boolean) as string[],
    };
  }

  async searchMulti(query: string): Promise<TmdbResult[]> {
    const genres = await this.getGenres();
    const data = await this.fetchApi<{ results: any[] }>('/search/multi', { // eslint-disable-line @typescript-eslint/no-explicit-any
      query,
      include_adult: 'false',
    });

    return data.results
      .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
      .map((r) =>
        r.media_type === 'movie'
          ? this.mapMovie(r, genres.movie)
          : this.mapTv(r, genres.tv)
      );
  }

  async searchMovies(query: string): Promise<TmdbResult[]> {
    const genres = await this.getGenres();
    const data = await this.fetchApi<{ results: any[] }>('/search/movie', { // eslint-disable-line @typescript-eslint/no-explicit-any
      query,
      include_adult: 'false',
    });
    return data.results.map((r) => this.mapMovie(r, genres.movie));
  }

  async searchTv(query: string): Promise<TmdbResult[]> {
    const genres = await this.getGenres();
    const data = await this.fetchApi<{ results: any[] }>('/search/tv', { // eslint-disable-line @typescript-eslint/no-explicit-any
      query,
      include_adult: 'false',
    });
    return data.results.map((r) => this.mapTv(r, genres.tv));
  }
}

export const tmdb = new TmdbService(process.env.TMDB_API_KEY!);
