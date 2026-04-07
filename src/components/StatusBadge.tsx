'use client';

import { Badge } from '@/components/ui/badge';
import type { WatchStatus } from '@/db/schema';
import { Clock, Eye, CheckCircle } from 'lucide-react';

const config: Record<
  WatchStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  plan_to_watch: {
    label: 'Plan to Watch',
    icon: <Clock className="size-3" />,
    className:
      'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border',
  },
  watching: {
    label: 'Watching',
    icon: <Eye className="size-3" />,
    className:
      'bg-primary/15 text-primary hover:bg-primary/20 border-primary/30',
  },
  watched: {
    label: 'Watched',
    icon: <CheckCircle className="size-3" />,
    className:
      'bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/20 border-green-500/30',
  },
};

export function StatusBadge({ status }: { status: WatchStatus }) {
  const { label, icon, className } = config[status];
  return (
    <Badge variant="outline" className={`gap-1 ${className}`}>
      {icon}
      {label}
    </Badge>
  );
}
