import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/format';
import type { DashboardStats } from '@/types/dashboard';
import { RevenueMiniCard } from './RevenueMiniCard';

interface RevenueOverviewCardProps {
  stats:    DashboardStats | null;
  loading?: boolean;
}

const BREAKDOWN_CONFIG = [
  { key: 'subscriptions' as const, label: 'Subscriptions', color: '#8B5CF6' },
  { key: 'tips'          as const, label: 'Tips',          color: '#EC4899' },
  { key: 'ppv'           as const, label: 'PPV',           color: '#3B82F6' },
  { key: 'messages'      as const, label: 'Messages',      color: '#10B981' },
  { key: 'streams'       as const, label: 'Streams',       color: '#F59E0B' },
  { key: 'referrals'     as const, label: 'Referrals',     color: '#6366F1' },
];

export function RevenueOverviewCard({ stats, loading = false }: RevenueOverviewCardProps) {
  if (loading || !stats) {
    return (
      <div className="bg-bg-surface border border-bg-border rounded-xl p-6 animate-skeleton">
        <div className="h-4 w-32 bg-bg-muted rounded mb-4" />
        <div className="h-12 w-48 bg-bg-muted rounded mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[68px] bg-bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const positive = stats.totalRevenueChange >= 0;

  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-6 shadow-card">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            Total earnings
          </p>
          <div className="flex items-end gap-3">
            <span className="text-metric-lg font-bold text-text-primary tabular-nums leading-none">
              {formatCurrency(stats.totalRevenue)}
            </span>
            <span
              className={[
                'inline-flex items-center gap-1 text-sm font-medium pb-1',
                positive ? 'text-success-text' : 'text-danger-text',
              ].join(' ')}
            >
              {positive
                ? <TrendingUp size={14} className="shrink-0" />
                : <TrendingDown size={14} className="shrink-0" />
              }
              {formatPercent(stats.totalRevenueChange)}
            </span>
          </div>
        </div>

        {/* Secondary stats */}
        <div className="flex items-start gap-6">
          <div className="text-right">
            <p className="text-xs text-text-muted mb-1">Subscribers</p>
            <p className="text-lg font-semibold text-text-primary tabular-nums">
              {stats.subscribers.toLocaleString('en-GB')}
            </p>
            <p className={['text-xs tabular-nums', stats.subscribersChange >= 0 ? 'text-success-text' : 'text-danger-text'].join(' ')}>
              {formatPercent(stats.subscribersChange)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted mb-1">Total views</p>
            <p className="text-lg font-semibold text-text-primary tabular-nums">
              {stats.totalViews.toLocaleString('en-GB')}
            </p>
            <p className="text-xs text-text-muted">this period</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted mb-1">Engagement</p>
            <p className="text-lg font-semibold text-text-primary tabular-nums">
              {stats.engagementRate}%
            </p>
            <p className="text-xs text-text-muted">rate</p>
          </div>
        </div>
      </div>

      {/* Revenue breakdown mini-cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {BREAKDOWN_CONFIG.map(({ key, label, color }) => (
          <RevenueMiniCard
            key={key}
            label={label}
            amount={stats.breakdown[key]}
            total={stats.totalRevenue}
            color={color}
          />
        ))}
      </div>
    </div>
  );
}
