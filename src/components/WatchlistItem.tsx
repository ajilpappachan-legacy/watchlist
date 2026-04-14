'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/StatusBadge';
import { Trash2, Star, Film, Tv, Calendar, GripVertical } from 'lucide-react';
import { TMDB_IMG_BASE } from '@/lib/tmdb';
import type { WatchStatus } from '@/db/schema';

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

interface Props {
  item: WatchlistItemData;
  onStatusChange: (id: number, status: WatchStatus) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
  draggable?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragEnter?: () => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
}

const STATUS_OPTIONS: { value: WatchStatus; label: string }[] = [
  { value: 'plan_to_watch', label: 'Plan to Watch' },
  { value: 'watching', label: 'Watching' },
  { value: 'watched', label: 'Watched' },
];

function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function WatchlistItem({
  item,
  onStatusChange,
  onRemove,
  draggable: isDraggable = false,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragEnter,
  onDrop,
  onDragEnd,
}: Props) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const posterUrl = item.posterPath ? `${TMDB_IMG_BASE}${item.posterPath}` : null;

  const handleStatusChange = async (status: WatchStatus) => {
    setIsUpdating(true);
    try {
      await onStatusChange(item.id, status);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove) {
      setConfirmRemove(true);
      setTimeout(() => setConfirmRemove(false), 3000);
      return;
    }
    setIsRemoving(true);
    try {
      await onRemove(item.id);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Card
      draggable={isDraggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        // Replace the default full-card ghost with a compact title pill
        const ghost = document.createElement('div');
        ghost.textContent = item.title;
        ghost.style.cssText =
          'position:fixed;top:-200px;padding:6px 14px;border-radius:9999px;font-size:13px;font-weight:500;white-space:nowrap;max-width:280px;overflow:hidden;text-overflow:ellipsis;background:#6d28d9;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.3)';
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, 20);
        requestAnimationFrame(() => ghost.remove());
        onDragStart?.();
      }}
      onDragEnter={(e) => { e.preventDefault(); onDragEnter?.(); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onDrop?.(); }}
      onDragEnd={onDragEnd}
      className={`border-border/50 transition-all duration-200 bg-card
        ${isDraggable ? 'cursor-default' : ''}
        ${isDragging ? 'opacity-40 scale-[0.98]' : 'hover:border-primary/30'}
        ${isDragOver ? 'border-primary ring-1 ring-primary/40' : ''}
      `}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Drag handle */}
          {isDraggable && (
            <div className="flex items-center shrink-0 -ml-1 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors">
              <GripVertical className="size-4" />
            </div>
          )}
          {/* Poster */}
          <div className="relative shrink-0 w-16 h-24 rounded-md overflow-hidden bg-muted">
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={item.title}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {item.mediaType === 'movie' ? (
                  <Film className="size-6 opacity-40" />
                ) : (
                  <Tv className="size-6 opacity-40" />
                )}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm leading-tight truncate">
                  {item.title}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.year && (
                    <span className="text-xs text-muted-foreground">
                      {item.year}
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className="text-xs px-1.5 py-0 h-4 gap-0.5 border-border/50"
                  >
                    {item.mediaType === 'movie' ? (
                      <Film className="size-2.5" />
                    ) : (
                      <Tv className="size-2.5" />
                    )}
                    {item.mediaType === 'movie' ? 'Movie' : 'TV'}
                  </Badge>
                  {item.rating != null && item.rating > 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Star className="size-3 fill-yellow-400 text-yellow-400" />
                      {item.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              {/* Remove button */}
              <Button
                variant={confirmRemove ? 'destructive' : 'ghost'}
                size="icon"
                className="shrink-0 size-7"
                onClick={handleRemove}
                disabled={isRemoving}
                title={confirmRemove ? 'Click again to confirm' : 'Remove from watchlist'}
              >
                {isRemoving ? (
                  <div className="size-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
              </Button>
            </div>

            {/* Genres */}
            {item.genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.genres.slice(0, 3).map((genre) => (
                  <Badge
                    key={genre}
                    variant="outline"
                    className="text-xs px-1.5 py-0 h-4 border-primary/25 text-primary/80"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            )}

            {/* Status & dates row */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Select
                  value={item.status}
                  onValueChange={(v) => handleStatusChange(v as WatchStatus)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="h-7 text-xs w-auto min-w-36 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col items-end gap-0.5">
                {item.watchedAt && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3" />
                    Watched {formatDate(item.watchedAt)}
                  </span>
                )}
                {item.addedAt && (
                  <span className="text-xs text-muted-foreground/60">
                    Added {formatDate(item.addedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
