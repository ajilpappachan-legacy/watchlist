'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Film, Tv, LayoutGrid } from 'lucide-react';

type SearchType = 'multi' | 'movie' | 'tv';

interface Props {
  onSearch: (query: string, type: SearchType) => void;
  isLoading: boolean;
}

const TYPE_OPTIONS: { value: SearchType; label: string; icon: React.ReactNode }[] = [
  { value: 'multi', label: 'All', icon: <LayoutGrid className="size-3.5" /> },
  { value: 'movie', label: 'Movies', icon: <Film className="size-3.5" /> },
  { value: 'tv', label: 'TV Shows', icon: <Tv className="size-3.5" /> },
];

export function SearchBar({ onSearch, isLoading }: Props) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<SearchType>('multi');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) return;

    debounceRef.current = setTimeout(() => {
      onSearch(query.trim(), type);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, type, onSearch]);

  const handleClear = () => {
    setQuery('');
  };

  const handleTypeChange = (newType: SearchType) => {
    setType(newType);
    if (query.trim().length >= 2) {
      onSearch(query.trim(), newType);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies and TV shows..."
          className="pl-10 pr-10 h-12 text-base border-border/60 focus-visible:ring-primary bg-card"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        {TYPE_OPTIONS.map(({ value, label, icon }) => (
          <Button
            key={value}
            variant={type === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTypeChange(value)}
            className={
              type === value
                ? 'bg-primary text-primary-foreground'
                : 'border-border/60 hover:bg-secondary'
            }
          >
            {icon}
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
