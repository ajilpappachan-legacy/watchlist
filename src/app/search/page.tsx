'use client';

import { useState, useCallback, useEffect } from 'react';
import { SearchBar, SearchFilters } from '@/components/SearchBar';
import { MediaCard } from '@/components/MediaCard';
import { Clapperboard, Search } from 'lucide-react';
import type { TmdbResult } from '@/lib/tmdb';
import type { WatchStatus } from '@/db/schema';

export default function SearchPage() {
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
    async (query: string, filters: SearchFilters) => {
      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const params = new URLSearchParams({ q: query, type: filters.type });
        if (filters.language) params.set('language', filters.language);
        if (filters.year) params.set('year', filters.year);
        const res = await fetch(`/api/search?${params.toString()}`);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Search className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Search</h1>
            <p className="text-sm text-muted-foreground">
              Find movies and TV shows to add to your watchlist.
            </p>
          </div>
        </div>
      </div>

      <SearchBar onSearch={handleSearch} isLoading={isLoading} />

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
        <div className="text-center py-16 space-y-2">
          <Clapperboard className="size-10 mx-auto text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">
            Enter a title above to get started
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
