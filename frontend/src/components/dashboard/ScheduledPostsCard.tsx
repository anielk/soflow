import { CalendarClock, Clock } from 'lucide-react';
import { Badge, EmptyState, Skeleton } from '@/components/ui';
import { timeUntil } from '@/lib/format';
import type { ScheduledPost } from '@/types/dashboard';

interface ScheduledPostsCardProps {
  posts:    ScheduledPost[];
  loading?: boolean;
}

export function ScheduledPostsCard({ posts, loading = false }: ScheduledPostsCardProps) {
  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl shadow-card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-bg-border shrink-0">
        <h3 className="text-sm font-semibold text-text-primary">Scheduled posts</h3>
        <button
          type="button"
          className="text-xs text-text-muted hover:text-violet-400 transition-colors duration-150"
        >
          View queue
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {loading && (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton width={36} height={36} rounded="lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton width="70%" height={12} className="rounded" />
                  <Skeleton width="40%" height={11} className="rounded" />
                </div>
                <Skeleton width={44} height={22} className="rounded-full" />
              </div>
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <EmptyState
            icon={CalendarClock}
            title="Nothing scheduled"
            description="Queue your next post to keep fans engaged."
            action={{ label: 'Schedule a post', href: '/of-manager/queue' }}
            size="sm"
          />
        )}

        {!loading && posts.length > 0 && (
          <ul className="divide-y divide-bg-border/50">
            {posts.map((post) => {
              const eta = timeUntil(post.scheduledAt);
              const isSoon =
                new Date(post.scheduledAt).getTime() - Date.now() < 3 * 3_600_000;

              return (
                <li
                  key={post.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-bg-subtle transition-colors duration-100 group"
                >
                  {/* Thumbnail placeholder */}
                  <div className="w-9 h-9 rounded-lg bg-bg-overlay border border-bg-border flex items-center justify-center shrink-0">
                    <CalendarClock size={15} className="text-text-disabled" />
                  </div>

                  {/* Title + eta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate font-medium">
                      {post.title}
                    </p>
                    <p className={[
                      'flex items-center gap-1 text-xs mt-0.5',
                      isSoon ? 'text-warning-text' : 'text-text-muted',
                    ].join(' ')}>
                      <Clock size={10} className="shrink-0" />
                      {eta}
                    </p>
                  </div>

                  {/* Type badge */}
                  {post.type === 'ppv' && post.price != null ? (
                    <Badge variant="violet" size="sm">
                      €{post.price}
                    </Badge>
                  ) : (
                    <Badge variant="success" size="sm">
                      Free
                    </Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
