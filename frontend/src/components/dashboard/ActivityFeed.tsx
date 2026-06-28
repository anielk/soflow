import { Activity } from 'lucide-react';
import { EmptyState, Skeleton } from '@/components/ui';
import type { ActivityItem } from '@/types/dashboard';
import { ActivityFeedItem } from './ActivityFeedItem';

interface ActivityFeedProps {
  items:    ActivityItem[];
  loading?: boolean;
}

export function ActivityFeed({ items, loading = false }: ActivityFeedProps) {
  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl shadow-card flex flex-col h-full">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-bg-border shrink-0">
        <h3 className="text-sm font-semibold text-text-primary">Recent activity</h3>
        <button
          type="button"
          className="text-xs text-text-muted hover:text-violet-400 transition-colors duration-150"
        >
          View all
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="space-y-px py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <Skeleton width={2} height={32} rounded="full" />
                <Skeleton width={28} height={28} rounded="full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton width="60%" height={12} rounded="sm" />
                </div>
                <Skeleton width={48} height={20} rounded="full" />
              </div>
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Fan interactions will appear here in real time."
            size="sm"
          />
        )}

        {!loading && items.length > 0 && (
          <div className="py-1 divide-y divide-bg-border/50">
            {items.map((item) => (
              <ActivityFeedItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
