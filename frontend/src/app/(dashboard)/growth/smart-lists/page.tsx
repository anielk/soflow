'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Button } from '@/components/ui';
import { Plus, Users, TrendingUp, DollarSign, Send } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';

interface FanSegment {
  id:          string;
  name:        string;
  description: string;
  criteria:    string;
  fanCount:    number;
  avgSpend:    number;
  color:       string;
  createdAt:   string;
}

const MOCK_SEGMENTS: FanSegment[] = [
  { id: 'l1', name: 'High spenders',       description: 'Fans who have spent over €100 total',       criteria: 'Total spend > €100',        fanCount: 312,  avgSpend: 187, color: '#10B981', createdAt: '2026-03-01T00:00:00Z' },
  { id: 'l2', name: 'PPV buyers',           description: 'Fans who purchased at least one PPV item',  criteria: 'PPV purchases ≥ 1',         fanCount: 548,  avgSpend: 68,  color: '#8B5CF6', createdAt: '2026-03-15T00:00:00Z' },
  { id: 'l3', name: 'At risk of churn',     description: 'Fans inactive for more than 30 days',       criteria: 'Last activity > 30 days',   fanCount: 127,  avgSpend: 24,  color: '#EF4444', createdAt: '2026-04-01T00:00:00Z' },
  { id: 'l4', name: 'New subscribers',      description: 'Fans who subscribed in the last 7 days',    criteria: 'Joined ≤ 7 days ago',       fanCount: 89,   avgSpend: 10,  color: '#F59E0B', createdAt: '2026-04-10T00:00:00Z' },
  { id: 'l5', name: 'Tippers',              description: 'Fans who have tipped at least once',        criteria: 'Tip count ≥ 1',             fanCount: 234,  avgSpend: 52,  color: '#3B82F6', createdAt: '2026-05-01T00:00:00Z' },
  { id: 'l6', name: 'Long-term subs',       description: 'Fans subscribed for more than 3 months',    criteria: 'Subscription age > 90 days', fanCount: 890, avgSpend: 42,  color: '#6366F1', createdAt: '2026-05-10T00:00:00Z' },
];

export default function SmartListsPage() {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  const totalFans    = MOCK_SEGMENTS.reduce((a, s) => a + s.fanCount,  0);
  const totalRevenue = MOCK_SEGMENTS.reduce((a, s) => a + s.fanCount * s.avgSpend, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Smart Lists</h1>
          <p className="mt-1 text-sm text-text-muted">
            Automatically segmented fan lists for targeted messaging campaigns
          </p>
        </div>
        <Button variant="primary" size="md" icon={Plus}>
          New list
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total segments', value: String(MOCK_SEGMENTS.length), icon: Users,      color: '#8B5CF6' },
          { label: 'Total fans',     value: formatNumber(totalFans),       icon: TrendingUp, color: '#3B82F6' },
          { label: 'Est. value',     value: formatCurrency(totalRevenue),  icon: DollarSign, color: '#10B981' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-disabled">{label}</p>
              <p className="mt-0.5 text-base font-bold text-text-primary tabular-nums leading-none">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Segment cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_SEGMENTS.map((seg) => (
          <div
            key={seg.id}
            className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 hover:border-violet-500/30 transition-colors cursor-pointer group"
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${seg.color}18` }}>
                <Users size={16} style={{ color: seg.color }} />
              </div>
              <button
                type="button"
                className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
              >
                <Send size={11} />
                Message
              </button>
            </div>

            <h3 className="font-semibold text-text-primary mb-0.5">{seg.name}</h3>
            <p className="text-xs text-text-muted mb-4 leading-relaxed">{seg.description}</p>

            {/* Stats row */}
            <div className="flex items-center gap-4">
              <div>
                <p className="text-lg font-bold text-text-primary tabular-nums">{formatNumber(seg.fanCount)}</p>
                <p className="text-[11px] text-text-muted">fans</p>
              </div>
              <div className="h-8 w-px bg-bg-border/60" />
              <div>
                <p className="text-lg font-bold text-text-primary tabular-nums">€{seg.avgSpend}</p>
                <p className="text-[11px] text-text-muted">avg spend</p>
              </div>
              <div className="h-8 w-px bg-bg-border/60" />
              <div>
                <p className="text-lg font-bold text-text-primary tabular-nums">{formatCurrency(seg.fanCount * seg.avgSpend)}</p>
                <p className="text-[11px] text-text-muted">est. value</p>
              </div>
            </div>

            {/* Criteria */}
            <div className="mt-4 pt-4 border-t border-bg-border/40">
              <p className="text-[11px] text-text-disabled uppercase tracking-[0.06em] mb-1">Criteria</p>
              <code className="text-xs text-text-secondary bg-bg-subtle px-2 py-0.5 rounded">{seg.criteria}</code>
            </div>
          </div>
        ))}

        {/* Create new card */}
        <button
          type="button"
          className="bg-bg-surface border border-dashed border-bg-border/60 rounded-xl p-5 hover:border-violet-500/40 hover:bg-violet-600/[0.03] transition-colors flex flex-col items-center justify-center gap-2 text-center min-h-[180px]"
        >
          <Plus size={20} className="text-text-disabled" />
          <p className="text-sm font-medium text-text-secondary">Create segment</p>
          <p className="text-xs text-text-muted">Define criteria to auto-populate fans</p>
        </button>
      </div>
    </div>
  );
}
