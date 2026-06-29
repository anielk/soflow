'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { MessageSquare, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';

const MOCK_CREATORS_MSG = [
  { name: 'Emma Rose',    username: 'emmarose',   sent: 3240, opens: 2861, replies: 1540, conversions: 210, revenue: 1840, avgResponse: 3 },
  { name: 'Sophia Lee',   username: 'sophialee',  sent: 2180, opens: 1830, replies: 940,  conversions: 128, revenue: 1120, avgResponse: 5 },
  { name: 'Mia Johnson',  username: 'miajohnson', sent: 1840, opens: 1490, replies: 740,  conversions: 98,  revenue: 870,  avgResponse: 7 },
  { name: 'Zoe Martinez', username: 'zoem',       sent: 890,  opens: 670,  replies: 290,  conversions: 34,  revenue: 290,  avgResponse: 12 },
];

const totals = MOCK_CREATORS_MSG.reduce(
  (a, c) => ({
    sent:        a.sent + c.sent,
    opens:       a.opens + c.opens,
    replies:     a.replies + c.replies,
    conversions: a.conversions + c.conversions,
    revenue:     a.revenue + c.revenue,
  }),
  { sent: 0, opens: 0, replies: 0, conversions: 0, revenue: 0 },
);

const openRate   = Math.round((totals.opens / totals.sent) * 100);
const replyRate  = Math.round((totals.replies / totals.sent) * 100);
const convRate   = Math.round((totals.conversions / totals.sent) * 100);

export default function MessageDashboardPage() {
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
          <span className="text-text-secondary">Message dashboard</span>
        </div>
        <h1 className="text-xl font-semibold text-text-primary">Message dashboard</h1>
        <p className="mt-1 text-sm text-text-muted">Open rates, reply rates and revenue from fan messaging</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Messages sent',   value: formatNumber(totals.sent),      icon: MessageSquare, color: '#8B5CF6' },
          { label: 'Open rate',       value: `${openRate}%`,                  icon: TrendingUp,    color: '#10B981' },
          { label: 'Avg response',    value: '7 min',                          icon: Clock,         color: '#F59E0B' },
          { label: 'Revenue from msg', value: formatCurrency(totals.revenue), icon: DollarSign,   color: '#3B82F6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-disabled">{label}</p>
              <p className="mt-0.5 text-base font-bold text-text-primary tabular-nums leading-none">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Rate cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open rate',   value: openRate,   color: '#10B981' },
          { label: 'Reply rate',  value: replyRate,  color: '#8B5CF6' },
          { label: 'Conv. rate',  value: convRate,   color: '#3B82F6' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-bg-surface border border-bg-border/60 rounded-xl p-5">
            <p className="text-xs text-text-muted mb-2">{label}</p>
            <p className="text-3xl font-bold tabular-nums" style={{ color }}>{value}%</p>
            <div className="mt-3 h-1.5 bg-bg-subtle rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${value}%`, background: color, opacity: 0.8 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Per-creator breakdown */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-bg-border/40">
          <h2 className="text-sm font-semibold text-text-primary">Breakdown by creator</h2>
          <p className="text-xs text-text-muted mt-0.5">Current month</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border/40">
                {['Creator', 'Sent', 'Opens', 'Replies', 'Conversions', 'Revenue', 'Avg response'].map((col) => (
                  <th key={col} className="text-left text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border/40">
              {MOCK_CREATORS_MSG.map((c) => (
                <tr key={c.username} className="hover:bg-bg-subtle/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{c.name}</p>
                    <p className="text-xs text-text-muted">@{c.username}</p>
                  </td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums">{formatNumber(c.sent)}</td>
                  <td className="px-4 py-3">
                    <span className="text-text-secondary tabular-nums">{formatNumber(c.opens)}</span>
                    <span className="ml-1.5 text-xs text-text-muted">({Math.round((c.opens / c.sent) * 100)}%)</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-text-secondary tabular-nums">{formatNumber(c.replies)}</span>
                    <span className="ml-1.5 text-xs text-text-muted">({Math.round((c.replies / c.sent) * 100)}%)</span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums">{c.conversions}</td>
                  <td className="px-4 py-3 font-semibold text-text-primary tabular-nums">{formatCurrency(c.revenue)}</td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums text-xs">{c.avgResponse} min</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-bg-border/60 bg-bg-subtle/20">
                <td className="px-4 py-3 text-xs font-semibold text-text-secondary">Total</td>
                <td className="px-4 py-3 text-xs font-semibold text-text-primary tabular-nums">{formatNumber(totals.sent)}</td>
                <td className="px-4 py-3 text-xs text-text-primary tabular-nums">{formatNumber(totals.opens)}</td>
                <td className="px-4 py-3 text-xs text-text-primary tabular-nums">{formatNumber(totals.replies)}</td>
                <td className="px-4 py-3 text-xs text-text-primary tabular-nums">{totals.conversions}</td>
                <td className="px-4 py-3 text-xs font-semibold text-text-primary tabular-nums">{formatCurrency(totals.revenue)}</td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
