import { Target } from 'lucide-react';
import { EmptyState, Skeleton } from '@/components/ui';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { CreatorGoal } from '@/types/dashboard';

interface CreatorProgressCardProps {
  goals:    CreatorGoal[];
  loading?: boolean;
}

function progressStatus(pct: number): { label: string; color: string } {
  if (pct >= 80) return { label: 'On track',         color: '#10B981' };
  if (pct >= 50) return { label: 'Needs attention',  color: '#F59E0B' };
  return             { label: 'Behind target',       color: '#EF4444' };
}

function formatValue(value: number, unit: string): string {
  if (unit === '€') return formatCurrency(value, value >= 10_000);
  return formatNumber(value);
}

export function CreatorProgressCard({ goals, loading = false }: CreatorProgressCardProps) {
  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl shadow-card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-bg-border shrink-0">
        <h3 className="text-sm font-semibold text-text-primary">Creator goals</h3>
        <button
          type="button"
          className="text-xs text-text-muted hover:text-violet-400 transition-colors duration-150"
        >
          Edit goals
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {loading && (
          <div className="p-4 space-y-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton width="40%" height={12} className="rounded" />
                  <Skeleton width="30%" height={12} className="rounded" />
                </div>
                <Skeleton width="100%" height={8} className="rounded-full" />
                <Skeleton width="20%" height={11} className="rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && goals.length === 0 && (
          <EmptyState
            icon={Target}
            title="No goals set"
            description="Set subscriber and revenue targets to track your progress."
            size="sm"
          />
        )}

        {!loading && goals.length > 0 && (
          <ul className="divide-y divide-bg-border/50">
            {goals.map((goal) => {
              const pct    = Math.min(100, (goal.current / goal.target) * 100);
              const status = progressStatus(pct);
              const remaining = goal.target - goal.current;

              return (
                <li key={goal.label} className="px-4 py-4 space-y-2.5">
                  {/* Label + values */}
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-text-primary">{goal.label}</span>
                    <span className="text-xs text-text-muted tabular-nums whitespace-nowrap">
                      <span className="text-text-primary font-semibold">{formatValue(goal.current, goal.unit)}</span>
                      {' / '}
                      {formatValue(goal.target, goal.unit)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-bg-overlay rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width:      `${pct}%`,
                        background: `linear-gradient(90deg, #6D28D9, #8B5CF6)`,
                      }}
                    />
                  </div>

                  {/* Footer row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: status.color }}
                        aria-hidden="true"
                      />
                      <span className="text-xs" style={{ color: status.color }}>
                        {status.label}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted tabular-nums">
                      {formatValue(remaining, goal.unit)} remaining · {pct.toFixed(0)}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
