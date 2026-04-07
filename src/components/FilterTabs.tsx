'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { WatchStatus } from '@/db/schema';

type FilterValue = 'all' | WatchStatus;

interface Props {
  activeFilter: FilterValue;
  onChange: (filter: FilterValue) => void;
  counts: Record<FilterValue, number>;
}

const TABS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'plan_to_watch', label: 'Plan to Watch' },
  { value: 'watching', label: 'Watching' },
  { value: 'watched', label: 'Watched' },
];

export function FilterTabs({ activeFilter, onChange, counts }: Props) {
  return (
    <Tabs
      value={activeFilter}
      onValueChange={(v) => onChange(v as FilterValue)}
    >
      <TabsList className="h-auto flex-wrap gap-1 bg-secondary/50 p-1">
        {TABS.map(({ value, label }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {label}
            {counts[value] > 0 && (
              <Badge
                variant="secondary"
                className="h-5 min-w-5 px-1 text-xs data-[state=active]:bg-primary-foreground/20 data-[state=active]:text-primary-foreground"
              >
                {counts[value]}
              </Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
