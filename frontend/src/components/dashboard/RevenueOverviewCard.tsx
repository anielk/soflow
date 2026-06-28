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
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-7 animate-skeleton">
        <div className="h-3 w-28 bg-bg-muted rounded mb-5" />
        <div className="h-12 w-52 bg-bg-muted rounded mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[64px] bg-bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const positive = stats.totalRevenueChange >= 0;

  return (
    <div
      className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(ellipse 60% 80% at 10% 10%, rgba(124,58,237,0.05) 0%, transparent 70%)',
      }}
    >
      {/* Header */}
      <div className="px-7 pt-7 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          {/* Primary metric */}
          <div>
            <p className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.08em] mb-3">
              Total earnings
            </p>
            <div className="flex items-end gap-3">
              <span className="text-metric-lg font-bold text-text-primary tabular-nums leading-none">
                {formatCurrency(stats.totalRevenue)}
              </span>
              <span
                className={[
                  'inline-flex items-center gap-1 text-xs font-semibold pb-1',
                  positive ? 'text-success-text' : 'text-danger-text',
                ].join(' ')}
              >
                {positive
                  ? <TrendingUp size={13} className="shrink-0" />
                  : <TrendingDown size={13} className="shrink-0" />
                }
                {formatPercent(stats.totalRevenueChange)}
              </span>
            </div>
            <p className="text-xs text-text-disabled mt-1.5">vs. previous period</p>
          </div>

          {/* Secondary stats */}
          <div className="flex items-stretch gap-px">
            {[
              { label: 'Subscribers', value: stats.subscribers.toLocaleString('en-GB'), sub: formatPercent(stats.subscribersChange), subColor: stats.subscribersChange >= 0 ? 'text-success-text' : 'text-danger-text' },
              { label: 'Total views', value: stats.totalViews.toLocaleString('en-GB'), sub: 'this period', subColor: 'text-text-disabled' },
              { label: 'Engagement', value: `${stats.engagementRate}%`, sub: 'rate', subColor: 'text-text-disabled' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={[
                  'px-5 py-1 flex flex-col gap-1',
                  i > 0 ? 'border-l border-bg-border/40' : '',
                ].join(' ')}
              >
                <p className="text-[11px] text-text-disabled whitespace-nowrap">{stat.label}</p>
                <p className="text-base font-semibold text-text-primary tabular-nums leading-none">
                  {stat.value}
                </p>
                <p className={['text-[11px] tabular-nums', stat.subColor].join(' ')}>
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Breakdown grid */}
      <div className="px-7 pb-7 border-t border-bg-border/30">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-5">
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
    </div>
  );
}
