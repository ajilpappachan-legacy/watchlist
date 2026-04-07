'use client';

import { useState, useEffect, useCallback } from 'react';
import { WatchlistItem } from '@/components/WatchlistItem';
import { FilterTabs } from '@/components/FilterTabs';
import { BookMarked, Inbox } from 'lucide-react';
import type { WatchStatus } from '@/db/schema';

type FilterValue = 'all' | WatchStatus;

interface WatchlistItemData {
  id: number;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  overview: string | null;
  rating: number | null;
  genres: string[];
  year: string | null;
  status: WatchStatus;
  addedAt: Date | null;
  watchedAt: Date | null;
}

export default function WatchlistPage() {
  const [allItems, setAllItems] = useState<WatchlistItemData[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await fetch('/api/watchlist');
      const data = await res.json();
      setAllItems(data.items ?? []);
    } catch {
      // silent fail — list stays as-is
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const handleStatusChange = useCallback(
    async (id: number, status: WatchStatus) => {
      const res = await fetch(`/api/watchlist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const { item } = await res.json();
        setAllItems((prev) => prev.map((i) => (i.id === id ? item : i)));
      }
    },
    []
  );

  const handleRemove = useCallback(async (id: number) => {
    const res = await fetch(`/api/watchlist/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setAllItems((prev) => prev.filter((i) => i.id !== id));
    }
  }, []);

  const filteredItems =
    activeFilter === 'all'
      ? allItems
      : allItems.filter((i) => i.status === activeFilter);

  const counts: Record<FilterValue, number> = {
    all: allItems.length,
    plan_to_watch: allItems.filter((i) => i.status === 'plan_to_watch').length,
    watching: allItems.filter((i) => i.status === 'watching').length,
    watched: allItems.filter((i) => i.status === 'watched').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookMarked className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Watchlist</h1>
            <p className="text-sm text-muted-foreground">
              {allItems.length} title{allItems.length !== 1 ? 's' : ''}
              {counts.watched > 0 && ` · ${counts.watched} watched`}
              {counts.watching > 0 && ` · ${counts.watching} watching`}
            </p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      {allItems.length > 0 && (
        <FilterTabs
          activeFilter={activeFilter}
          onChange={setActiveFilter}
          counts={counts}
        />
      )}

      {/* Empty states */}
      {allItems.length === 0 && (
        <div className="text-center py-24 space-y-4">
          <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
            <Inbox className="size-10 text-primary/50" />
          </div>
          <div>
            <p className="font-medium text-lg">Your watchlist is empty</p>
            <p className="text-muted-foreground text-sm mt-1">
              Search for movies or TV shows and add them to get started
            </p>
          </div>
        </div>
      )}

      {allItems.length > 0 && filteredItems.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <Inbox className="size-10 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">
            No items in this category yet
          </p>
        </div>
      )}

      {/* Items list */}
      {filteredItems.length > 0 && (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <WatchlistItem
              key={item.id}
              item={item}
              onStatusChange={handleStatusChange}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
