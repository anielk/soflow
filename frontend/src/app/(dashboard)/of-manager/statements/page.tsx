'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Badge, Button } from '@/components/ui';
import { Download, TrendingUp, Clock } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { Statement, StatementStatus } from '@/types/of-manager';

const MOCK_STATEMENTS: Statement[] = [
  { id: '6', period: 'June 2026',     periodStart: '2026-06-01', gross: 18420, platformFee: 3684, net: 14736, status: 'processing' },
  { id: '5', period: 'May 2026',      periodStart: '2026-05-01', gross: 21450, platformFee: 4290, net: 17160, status: 'paid'       },
  { id: '4', period: 'April 2026',    periodStart: '2026-04-01', gross: 19830, platformFee: 3966, net: 15864, status: 'paid'       },
  { id: '3', period: 'March 2026',    periodStart: '2026-03-01', gross: 17240, platformFee: 3448, net: 13792, status: 'paid'       },
  { id: '2', period: 'February 2026', periodStart: '2026-02-01', gross: 23810, platformFee: 4762, net: 19048, status: 'paid'       },
  { id: '1', period: 'January 2026',  periodStart: '2026-01-01', gross: 16380, platformFee: 3276, net: 13104, status: 'paid'       },
];

const STATUS_BADGE: Record<StatementStatus, { variant: 'success' | 'warning' | 'default'; label: string }> = {
  paid:       { variant: 'success', label: 'Paid'       },
  pending:    { variant: 'warning', label: 'Pending'    },
  processing: { variant: 'warning', label: 'Processing' },
};

const totalPaid      = MOCK_STATEMENTS.filter((s) => s.status === 'paid').reduce((a, s) => a + s.net, 0);
const totalGross     = MOCK_STATEMENTS.reduce((a, s) => a + s.gross, 0);
const processingStmt = MOCK_STATEMENTS.find((s) => s.status === 'processing');

export default function StatementsPage() {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Statements</h1>
          <p className="mt-1 text-sm text-text-muted">
            Monthly revenue statements — OnlyFans 80% payout.
          </p>
        </div>
        <Button variant="secondary" size="md" icon={Download}>
          Export CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
            <TrendingUp size={16} className="text-success" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-disabled">
              Total paid out
            </p>
            <p className="mt-0.5 text-lg font-bold text-text-primary tabular-nums leading-none">
              {formatCurrency(totalPaid)}
            </p>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-600/10 flex items-center justify-center shrink-0">
            <TrendingUp size={16} className="text-violet-400" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-disabled">
              Total gross (6mo)
            </p>
            <p className="mt-0.5 text-lg font-bold text-text-primary tabular-nums leading-none">
              {formatCurrency(totalGross)}
            </p>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
            <Clock size={16} className="text-warning-text" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-disabled">
              In processing
            </p>
            <p className="mt-0.5 text-lg font-bold text-text-primary tabular-nums leading-none">
              {processingStmt ? formatCurrency(processingStmt.net) : '€0'}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border/40">
                {['Period', 'Gross revenue', 'Platform fee (20%)', 'Net payout', 'Status', ''].map((col) => (
                  <th
                    key={col}
                    className="text-left text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-bg-border/40">
              {MOCK_STATEMENTS.map((stmt) => {
                const { variant, label } = STATUS_BADGE[stmt.status];
                return (
                  <tr
                    key={stmt.id}
                    className="hover:bg-bg-subtle/40 transition-colors duration-100"
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">{stmt.period}</td>
                    <td className="px-4 py-3 text-text-secondary tabular-nums">
                      {formatCurrency(stmt.gross)}
                    </td>
                    <td className="px-4 py-3 text-text-muted tabular-nums">
                      −{formatCurrency(stmt.platformFee)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-text-primary tabular-nums">
                      {formatCurrency(stmt.net)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={variant} size="sm">{label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {stmt.status === 'paid' && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-violet-400 transition-colors"
                        >
                          <Download size={11} />
                          PDF
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Footer totals */}
            <tfoot>
              <tr className="border-t-2 border-bg-border/40 bg-bg-subtle/30">
                <td className="px-4 py-3 text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em]">
                  6-month total
                </td>
                <td className="px-4 py-3 font-bold text-text-primary tabular-nums">
                  {formatCurrency(totalGross)}
                </td>
                <td className="px-4 py-3 text-text-muted tabular-nums">
                  −{formatCurrency(MOCK_STATEMENTS.reduce((a, s) => a + s.platformFee, 0))}
                </td>
                <td className="px-4 py-3 font-bold text-text-primary tabular-nums">
                  {formatCurrency(MOCK_STATEMENTS.reduce((a, s) => a + s.net, 0))}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Info footer */}
        <div className="px-4 py-3 border-t border-bg-border/40 bg-bg-subtle/20">
          <p className="text-xs text-text-disabled">
            Statements reflect OnlyFans payouts: 80% of gross revenue paid to creators, 20% platform fee retained.
            Processing statements are released within 7 business days.
          </p>
        </div>
      </div>

      {/* Platform fee breakdown */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Revenue breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Subscriptions', value: 0.62, color: '#8B5CF6' },
            { label: 'Tips',          value: 0.18, color: '#EC4899' },
            { label: 'PPV',           value: 0.14, color: '#3B82F6' },
            { label: 'Messages',      value: 0.06, color: '#10B981' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-xs text-text-muted">{label}</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {formatCurrency(totalGross * value)} · {formatNumber(Math.round(value * 100))}%
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
