'use client';

import { useState, useCallback, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { MediaCard } from '@/components/MediaCard';
import { Clapperboard, Sparkles } from 'lucide-react';
import type { TmdbResult } from '@/lib/tmdb';
import type { WatchStatus } from '@/db/schema';

export default function HomePage() {
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  // Set of "tmdbId-mediaType" strings for items already in watchlist
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());

  // Load current watchlist IDs on mount
  useEffect(() => {
    fetch('/api/watchlist')
      .then((r) => r.json())
      .then((data) => {
        const ids = new Set<string>(
          (data.items ?? []).map(
            (item: { tmdbId: number; mediaType: string }) =>
              `${item.tmdbId}-${item.mediaType}`
          )
        );
        setWatchlistIds(ids);
      })
      .catch(() => {});
  }, []);

  const handleSearch = useCallback(
    async (query: string, type: 'multi' | 'movie' | 'tv') => {
      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&type=${type}`
        );
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? 'Search failed');
          setResults([]);
        } else {
          setResults(data.results ?? []);
        }
      } catch {
        setError('Network error. Please try again.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleAdd = useCallback(
    async (item: TmdbResult, status: WatchStatus) => {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId: item.tmdbId,
          mediaType: item.mediaType,
          title: item.title,
          posterPath: item.posterPath,
          overview: item.overview,
          rating: item.rating,
          genres: item.genres,
          year: item.year,
          status,
        }),
      });

      if (res.ok || res.status === 409) {
        setWatchlistIds((prev) =>
          new Set([...prev, `${item.tmdbId}-${item.mediaType}`])
        );
      }
    },
    []
  );

  return (
    <div className="space-y-10">
      {/* Hero section */}
      <section className="text-center space-y-6 pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Sparkles className="size-5" />
            <span className="text-sm font-medium uppercase tracking-widest">
              Your personal library
            </span>
            <Sparkles className="size-5" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Discover & Track
            <span className="text-primary"> Movies </span>
            and
            <span className="text-primary"> TV Shows</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Search millions of titles, build your watchlist, and never lose
            track of what to watch next.
          </p>
        </div>

        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
      </section>

      {/* Results */}
      {error && (
        <div className="text-center py-8 text-destructive">{error}</div>
      )}

      {hasSearched && !isLoading && results.length === 0 && !error && (
        <div className="text-center py-16 space-y-3">
          <Clapperboard className="size-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">
            No results found. Try a different search term.
          </p>
        </div>
      )}

      {!hasSearched && (
        <div className="text-center py-16 space-y-3">
          <Clapperboard className="size-16 mx-auto text-primary/20" />
          <p className="text-muted-foreground text-lg">
            Start typing to search for movies and TV shows
          </p>
        </div>
      )}

      {results.length > 0 && (
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.map((item) => (
              <MediaCard
                key={`${item.tmdbId}-${item.mediaType}`}
                item={item}
                onAdd={handleAdd}
                isAdded={watchlistIds.has(`${item.tmdbId}-${item.mediaType}`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
