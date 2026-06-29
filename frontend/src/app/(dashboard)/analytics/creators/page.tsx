'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Avatar, Badge } from '@/components/ui';
import { TrendingUp, Users, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';
import { MOCK_CREATORS } from '@/lib/mock-creators';

const totalRevenue  = MOCK_CREATORS.reduce((a, c) => a + c.revenueMonth, 0);
const totalSubs     = MOCK_CREATORS.reduce((a, c) => a + c.subscribers, 0);
const avgRevenue    = Math.round(totalRevenue / MOCK_CREATORS.length);
const topCreator    = [...MOCK_CREATORS].sort((a, b) => b.revenueMonth - a.revenueMonth)[0];

export default function CreatorReportsPage() {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
          <span className="hover:text-text-secondary cursor-pointer" onClick={() => router.push('/analytics')}>
            Analytics
          </span>
          <span>/</span>
          <span className="text-text-secondary">Creator reports</span>
        </div>
        <h1 className="text-xl font-semibold text-text-primary">Creator reports</h1>
        <p className="mt-1 text-sm text-text-muted">Revenue and performance breakdown by creator</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total revenue / mo',   value: formatCurrency(totalRevenue),             icon: TrendingUp, color: '#10B981' },
          { label: 'Total subscribers',    value: formatNumber(totalSubs),                   icon: Users,      color: '#8B5CF6' },
          { label: 'Avg revenue / creator', value: formatCurrency(avgRevenue),              icon: BarChart3,  color: '#3B82F6' },
          { label: 'Top creator',          value: topCreator.displayName,                   icon: ArrowUpRight, color: '#F59E0B' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-disabled">{label}</p>
              <p className="mt-0.5 text-sm font-bold text-text-primary tabular-nums leading-none truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Creator table */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-bg-border/40">
          <h2 className="text-sm font-semibold text-text-primary">Performance by creator</h2>
          <p className="text-xs text-text-muted mt-0.5">Current month · sorted by revenue</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border/40">
                {['Creator', 'Status', 'Subscribers', '± Change', 'Revenue / mo', 'Posts', 'Sub price'].map((col) => (
                  <th key={col} className="text-left text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border/40">
              {[...MOCK_CREATORS].sort((a, b) => b.revenueMonth - a.revenueMonth).map((c, i) => (
                <tr
                  key={c.id}
                  className="hover:bg-bg-subtle/40 transition-colors cursor-pointer"
                  onClick={() => router.push(`/creators/${c.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-text-disabled w-4 text-right tabular-nums">{i + 1}</span>
                      <Avatar name={c.displayName} size="sm" />
                      <div>
                        <p className="font-medium text-text-primary">{c.displayName}</p>
                        <p className="text-xs text-text-muted">@{c.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={c.status === 'active' ? 'success' : c.status === 'paused' ? 'warning' : 'default'} size="sm">
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums">{formatNumber(c.subscribers)}</td>
                  <td className="px-4 py-3">
                    <div className={['flex items-center gap-1 text-xs tabular-nums', c.subscribersDelta >= 0 ? 'text-success-text' : 'text-danger-text'].join(' ')}>
                      {c.subscribersDelta >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      {Math.abs(c.subscribersDelta)}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-text-primary tabular-nums">
                    {c.status === 'paused' ? <span className="text-text-muted">—</span> : formatCurrency(c.revenueMonth)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums">{c.postsThisMonth}</td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums">€{c.subscriptionPrice}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-bg-border/60 bg-bg-subtle/20">
                <td colSpan={2} className="px-4 py-3 text-xs font-semibold text-text-secondary">Total</td>
                <td className="px-4 py-3 text-xs font-semibold text-text-primary tabular-nums">{formatNumber(totalSubs)}</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-xs font-semibold text-text-primary tabular-nums">{formatCurrency(totalRevenue)}</td>
                <td colSpan={2} className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
