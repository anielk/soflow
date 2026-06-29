'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Users, TrendingDown, DollarSign, Heart } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';

const MOCK_SEGMENTS = [
  { name: 'High spenders',       count: 312,  avgSpend: 187, churnRisk: 'Low',    newThisMonth: 24, color: '#10B981' },
  { name: 'PPV buyers',          count: 548,  avgSpend: 68,  churnRisk: 'Low',    newThisMonth: 41, color: '#8B5CF6' },
  { name: 'Regular subscribers', count: 2140, avgSpend: 14,  churnRisk: 'Medium', newThisMonth: 156, color: '#3B82F6' },
  { name: 'At risk of churn',    count: 127,  avgSpend: 14,  churnRisk: 'High',   newThisMonth: 0,  color: '#EF4444' },
  { name: 'New (< 7 days)',       count: 89,   avgSpend: 10,  churnRisk: 'Unknown', newThisMonth: 89, color: '#F59E0B' },
];

const totalFans   = MOCK_SEGMENTS.reduce((a, s) => a + s.count, 0);
const newThisMonth = MOCK_SEGMENTS.reduce((a, s) => a + s.newThisMonth, 0);
const avgLtv      = Math.round(MOCK_SEGMENTS.reduce((a, s) => a + s.avgSpend * s.count, 0) / totalFans);
const churnRiskHigh = MOCK_SEGMENTS.find((s) => s.churnRisk === 'High')?.count ?? 0;

const RISK_COLOR: Record<string, string> = {
  Low:     'text-success-text',
  Medium:  'text-warning-text',
  High:    'text-danger-text',
  Unknown: 'text-text-muted',
};

export default function FanReportsPage() {
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
          <span className="text-text-secondary">Fan reports</span>
        </div>
        <h1 className="text-xl font-semibold text-text-primary">Fan reports</h1>
        <p className="mt-1 text-sm text-text-muted">Subscriber segmentation and lifetime value analysis</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total fans',     value: formatNumber(totalFans),   icon: Users,        color: '#8B5CF6' },
          { label: 'New this month', value: formatNumber(newThisMonth), icon: Heart,        color: '#10B981' },
          { label: 'Avg LTV',        value: `€${avgLtv}`,              icon: DollarSign,   color: '#3B82F6' },
          { label: 'High churn risk', value: formatNumber(churnRiskHigh), icon: TrendingDown, color: '#EF4444' },
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

      {/* Distribution bar */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Fan distribution</h3>
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {MOCK_SEGMENTS.map((s) => (
            <div
              key={s.name}
              style={{ width: `${(s.count / totalFans) * 100}%`, background: s.color }}
              className="h-full"
              title={`${s.name}: ${s.count}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          {MOCK_SEGMENTS.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-xs text-text-secondary">{s.name}</span>
              <span className="text-xs text-text-muted tabular-nums">({formatNumber(s.count)})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Segment table */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-bg-border/40">
          <h2 className="text-sm font-semibold text-text-primary">Segments</h2>
          <p className="text-xs text-text-muted mt-0.5">Automatically computed from fan spending patterns</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-bg-border/40">
              {['Segment', 'Fans', 'New this mo', 'Avg spend', 'Churn risk', 'Est. revenue'].map((col) => (
                <th key={col} className="text-left text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-bg-border/40">
            {MOCK_SEGMENTS.map((s) => (
              <tr key={s.name} className="hover:bg-bg-subtle/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="font-medium text-text-primary">{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary tabular-nums">{formatNumber(s.count)}</td>
                <td className="px-4 py-3 text-text-secondary tabular-nums">+{s.newThisMonth}</td>
                <td className="px-4 py-3 text-text-secondary tabular-nums">€{s.avgSpend}</td>
                <td className={['px-4 py-3 text-xs font-medium', RISK_COLOR[s.churnRisk]].join(' ')}>
                  {s.churnRisk}
                </td>
                <td className="px-4 py-3 font-semibold text-text-primary tabular-nums">
                  {formatCurrency(s.count * s.avgSpend)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-bg-border/60 bg-bg-subtle/20">
              <td className="px-4 py-3 text-xs font-semibold text-text-secondary">Total</td>
              <td className="px-4 py-3 text-xs font-semibold text-text-primary tabular-nums">{formatNumber(totalFans)}</td>
              <td className="px-4 py-3 text-xs font-semibold text-text-primary tabular-nums">+{newThisMonth}</td>
              <td className="px-4 py-3 text-xs text-text-muted tabular-nums">€{avgLtv} avg</td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-xs font-semibold text-text-primary tabular-nums">
                {formatCurrency(MOCK_SEGMENTS.reduce((a, s) => a + s.count * s.avgSpend, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
