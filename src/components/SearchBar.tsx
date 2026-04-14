'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Film, Tv, LayoutGrid, SlidersHorizontal, ChevronDown } from 'lucide-react';
import type { TmdbLanguage } from '@/lib/tmdb';

type SearchType = 'multi' | 'movie' | 'tv';

export interface SearchFilters {
  type: SearchType;
  language: string;
  year: string;
}

interface Props {
  onSearch: (query: string, filters: SearchFilters) => void;
  isLoading: boolean;
}

const TYPE_OPTIONS: { value: SearchType; label: string; icon: React.ReactNode }[] = [
  { value: 'multi', label: 'All', icon: <LayoutGrid className="size-3.5" /> },
  { value: 'movie', label: 'Movies', icon: <Film className="size-3.5" /> },
  { value: 'tv', label: 'TV Shows', icon: <Tv className="size-3.5" /> },
];

function LanguageCombobox({
  value,
  onChange,
  languages,
}: {
  value: string;
  onChange: (code: string) => void;
  languages: TmdbLanguage[];
}) {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedLabel = value
    ? (languages.find((l) => l.iso_639_1 === value)?.english_name ?? value)
    : '';

  const filtered = inputValue.trim()
    ? languages.filter((l) =>
        l.english_name.toLowerCase().includes(inputValue.toLowerCase()) ||
        l.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        l.iso_639_1.toLowerCase().startsWith(inputValue.toLowerCase())
      )
    : languages;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setInputValue('');
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const select = useCallback(
    (lang: TmdbLanguage) => {
      onChange(lang.iso_639_1);
      setOpen(false);
      setInputValue('');
      setActiveIndex(-1);
    },
    [onChange]
  );

  const clear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
      setInputValue('');
      setActiveIndex(-1);
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true);
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setInputValue('');
      setActiveIndex(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      select(filtered[activeIndex]);
    }
  };

  return (
    <div ref={containerRef} className="relative min-w-[180px]">
      <div
        className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-sm transition-colors ${
          open ? 'border-ring ring-2 ring-ring/30' : 'border-input'
        } bg-transparent`}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        {open ? (
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setActiveIndex(-1); }}
            onKeyDown={handleKeyDown}
            placeholder="Search language…"
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-0"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={`flex-1 truncate ${selectedLabel ? '' : 'text-muted-foreground'}`}>
            {selectedLabel || 'Any language'}
          </span>
        )}
        <span className="flex shrink-0 items-center gap-0.5">
          {value && !open && (
            <button
              onClick={clear}
              className="text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              <X className="size-3" />
            </button>
          )}
          <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </div>

      {open && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">No languages found</li>
          ) : (
            filtered.map((lang, idx) => (
              <li
                key={lang.iso_639_1}
                className={`flex cursor-pointer items-center justify-between px-3 py-1.5 text-sm ${
                  idx === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                } ${lang.iso_639_1 === value ? 'font-medium' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); select(lang); }}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                <span>{lang.english_name}</span>
                {lang.name && lang.name !== lang.english_name && (
                  <span className="text-xs text-muted-foreground">{lang.name}</span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export function SearchBar({ onSearch, isLoading }: Props) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<SearchType>('multi');
  const [language, setLanguage] = useState('');
  const [year, setYear] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [languages, setLanguages] = useState<TmdbLanguage[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFilterCount = (language ? 1 : 0) + (year ? 1 : 0);

  // Fetch language list when filters are first opened
  useEffect(() => {
    if (!showFilters || languages.length > 0) return;
    fetch('/api/languages')
      .then((r) => r.json())
      .then((data) => setLanguages(data.languages ?? []))
      .catch(() => {});
  }, [showFilters, languages.length]);

  const triggerSearch = useCallback(
    (q: string, filters: SearchFilters) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const trimmed = q.trim();
      if (trimmed.length < 2) return;
      // Fire immediately for IMDB IDs (tt followed by digits)
      const delay = /^tt\d+$/i.test(trimmed) ? 0 : 400;
      debounceRef.current = setTimeout(() => onSearch(trimmed, filters), delay);
    },
    [onSearch]
  );

  useEffect(() => {
    triggerSearch(query, { type, language, year });
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, type, language, year, triggerSearch]);

  const handleTypeChange = (newType: SearchType) => {
    setType(newType);
    if (query.trim().length >= 2) {
      onSearch(query.trim(), { type: newType, language, year });
    }
  };

  const handleYearChange = (val: string) => {
    setYear(val.replace(/\D/g, '').slice(0, 4));
  };

  const clearFilters = () => {
    setLanguage('');
    setYear('');
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or IMDb ID (tt…)"
          className="pl-10 pr-10 h-12 text-base border-border/60 focus-visible:ring-primary bg-card"
        />
        {query && !isLoading && (
          <button
            onClick={() => setQuery('')}
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

      <div className="flex gap-2 justify-between items-center">
        <div className="flex gap-2">
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

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
          className={`border-border/60 gap-1.5 ${showFilters || activeFilterCount > 0 ? 'border-primary text-primary' : 'hover:bg-secondary'}`}
        >
          <SlidersHorizontal className="size-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 p-3 rounded-lg border border-border/60 bg-card">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium">Language</label>
            <LanguageCombobox
              value={language}
              onChange={setLanguage}
              languages={languages}
            />
          </div>

          <div className="flex flex-col gap-1 w-28">
            <label className="text-xs text-muted-foreground font-medium">Year</label>
            <Input
              value={year}
              onChange={(e) => handleYearChange(e.target.value)}
              placeholder="e.g. 2023"
              className="h-8 text-sm border-input"
              inputMode="numeric"
            />
          </div>

          {activeFilterCount > 0 && (
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors pb-1"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
