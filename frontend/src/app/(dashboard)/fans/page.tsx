'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { EmptyState, Skeleton } from '@/components/ui';
import { Users, TrendingUp, UserMinus } from 'lucide-react';

const STAT_PREVIEWS = [
  { label: 'Total fans',          icon: Users,       color: '#8B5CF6' },
  { label: 'Active this month',   icon: TrendingUp,  color: '#10B981' },
  { label: 'Churned this month',  icon: UserMinus,   color: '#EF4444' },
] as const;

const TABLE_COLS = ['Fan', 'Status', 'Subscribed', 'Total spent', 'Messages'];

export default function FansPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Fans</h1>
        <p className="mt-1 text-sm text-text-muted">
          All fan data across your creators in one place.
        </p>
      </div>

      {/* Metric preview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STAT_PREVIEWS.map(({ label, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 flex items-center gap-3"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${color}18` }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-disabled mb-1.5">
                {label}
              </p>
              <Skeleton width={48} height={18} className="rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Table shell */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        {/* Column headers — hidden on mobile */}
        <div className="hidden sm:flex items-center px-4 py-2.5 border-b border-bg-border/40 bg-bg-subtle/40">
          {TABLE_COLS.map((col) => (
            <div
              key={col}
              className="flex-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-disabled"
            >
              {col}
            </div>
          ))}
        </div>

        <EmptyState
          icon={Users}
          title="No fans yet"
          description="Fan data will appear here once your creators are connected and receiving subscribers."
          action={{ label: 'Set up a creator', href: '/creators' }}
          size="lg"
        />
      </div>
    </div>
  );
}
