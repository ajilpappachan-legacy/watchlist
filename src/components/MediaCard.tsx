'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Plus, Check, Film, Tv } from 'lucide-react';
import { TMDB_IMG_BASE } from '@/lib/tmdb';
import type { TmdbResult } from '@/lib/tmdb';
import type { WatchStatus } from '@/db/schema';

interface Props {
  item: TmdbResult;
  onAdd: (item: TmdbResult, status: WatchStatus) => Promise<void>;
  isAdded: boolean;
}

const STATUS_OPTIONS: { value: WatchStatus; label: string }[] = [
  { value: 'plan_to_watch', label: 'Plan to Watch' },
  { value: 'watching', label: 'Watching' },
  { value: 'watched', label: 'Watched' },
];

export function MediaCard({ item, onAdd, isAdded }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [showOverview, setShowOverview] = useState(false);

  const handleAdd = async (status: WatchStatus) => {
    setIsAdding(true);
    try {
      await onAdd(item, status);
    } finally {
      setIsAdding(false);
    }
  };

  const posterUrl = item.posterPath
    ? `${TMDB_IMG_BASE}${item.posterPath}`
    : null;

  return (
    <Card
      className="group overflow-hidden border-border/50 hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 bg-card"
      onMouseEnter={() => setShowOverview(true)}
      onMouseLeave={() => setShowOverview(false)}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {item.mediaType === 'movie' ? (
              <Film className="size-12 opacity-30" />
            ) : (
              <Tv className="size-12 opacity-30" />
            )}
          </div>
        )}

        {/* Overview overlay on hover */}
        {item.overview && (
          <div
            className={`absolute inset-0 bg-background/92 p-3 flex items-start transition-opacity duration-200 ${
              showOverview ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <p className="text-xs text-foreground/90 line-clamp-[10] leading-relaxed">
              {item.overview}
            </p>
          </div>
        )}

        {/* Media type badge */}
        <div className="absolute top-2 left-2">
          <Badge
            variant="secondary"
            className="text-xs gap-1 bg-background/80 backdrop-blur-sm"
          >
            {item.mediaType === 'movie' ? (
              <Film className="size-3" />
            ) : (
              <Tv className="size-3" />
            )}
            {item.mediaType === 'movie' ? 'Movie' : 'TV'}
          </Badge>
        </div>

        {/* Rating badge */}
        {item.rating > 0 && (
          <div className="absolute top-2 right-2">
            <Badge className="text-xs gap-1 bg-background/80 backdrop-blur-sm text-foreground">
              <Star className="size-3 fill-yellow-400 text-yellow-400" />
              {item.rating.toFixed(1)}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-3 space-y-2">
        <div>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {item.title}
          </h3>
          {item.year && (
            <p className="text-xs text-muted-foreground mt-0.5">{item.year}</p>
          )}
        </div>

        {/* Genres */}
        {item.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.genres.slice(0, 2).map((genre) => (
              <Badge
                key={genre}
                variant="outline"
                className="text-xs px-1.5 py-0 h-5 border-primary/30 text-primary"
              >
                {genre}
              </Badge>
            ))}
          </div>
        )}

        {/* Add to watchlist */}
        {isAdded ? (
          <Button
            size="sm"
            variant="secondary"
            disabled
            className="w-full gap-2 text-xs h-8"
          >
            <Check className="size-3" />
            In Watchlist
          </Button>
        ) : (
          <Select onValueChange={(v) => handleAdd(v as WatchStatus)} disabled={isAdding}>
            <SelectTrigger className="h-8 text-xs w-full bg-primary text-primary-foreground border-primary hover:bg-primary/90 gap-2">
              {isAdding ? (
                <div className="size-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="size-3" />
              )}
              Add to Watchlist
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  );
}
