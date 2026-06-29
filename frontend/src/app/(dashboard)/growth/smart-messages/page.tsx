'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Badge, Button } from '@/components/ui';
import { Plus, Play, Pause, Mail, TrendingUp, Send, ChevronUp, ChevronDown } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';

type SeqStatus = 'active' | 'paused' | 'draft';
interface Sequence {
  id:          string;
  name:        string;
  trigger:     string;
  messages:    number;
  sentTotal:   number;
  openRate:    number;
  convRate:    number;
  revenue:     number;
  status:      SeqStatus;
  createdAt:   string;
}

const MOCK_SEQUENCES: Sequence[] = [
  { id: 's1', name: 'New subscriber welcome',  trigger: 'New subscription', messages: 5, sentTotal: 3240, openRate: 68, convRate: 14, revenue: 1840, status: 'active', createdAt: '2026-03-01T00:00:00Z' },
  { id: 's2', name: 'PPV upsell series',        trigger: 'No PPV purchase',  messages: 3, sentTotal: 1890, openRate: 54, convRate: 8,  revenue: 1120, status: 'active', createdAt: '2026-03-10T00:00:00Z' },
  { id: 's3', name: 'Renewal reminder',          trigger: '3 days before exp', messages: 2, sentTotal: 980, openRate: 72, convRate: 22, revenue: 680, status: 'active', createdAt: '2026-04-01T00:00:00Z' },
  { id: 's4', name: 'Win-back campaign',         trigger: '30 days inactive',  messages: 4, sentTotal: 420, openRate: 41, convRate: 6,  revenue: 280, status: 'paused', createdAt: '2026-04-15T00:00:00Z' },
  { id: 's5', name: 'Tip appreciation follow-up', trigger: 'After tip >€20',   messages: 1, sentTotal: 210, openRate: 89, convRate: 31, revenue: 540, status: 'active', createdAt: '2026-05-01T00:00:00Z' },
];

const STATUS_CONFIG: Record<SeqStatus, { variant: 'success' | 'warning' | 'default'; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  paused: { variant: 'warning', label: 'Paused' },
  draft:  { variant: 'default', label: 'Draft'  },
};

type SortField = 'name' | 'sentTotal' | 'openRate' | 'convRate' | 'revenue';
type SortDir   = 'asc' | 'desc';

export default function SmartMessagesPage() {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDir,   setSortDir]   = useState<SortDir>('desc');
  const [sequences, setSequences] = useState(MOCK_SEQUENCES);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  }

  function toggleStatus(id: string) {
    setSequences((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === 'active' ? 'paused' : 'active' }
          : s,
      ),
    );
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp size={12} className="text-text-disabled/40" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-violet-400" /> : <ChevronDown size={12} className="text-violet-400" />;
  }

  const rows = [...sequences].sort((a, b) => {
    const av = a[sortField] ?? '';
    const bv = b[sortField] ?? '';
    const cmp = typeof av === 'string' ? av.localeCompare(String(bv)) : (av as number) - (bv as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalRevenue  = sequences.reduce((a, s) => a + s.revenue,   0);
  const totalSent     = sequences.reduce((a, s) => a + s.sentTotal, 0);
  const activeCount   = sequences.filter((s) => s.status === 'active').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Smart Messages</h1>
          <p className="mt-1 text-sm text-text-muted">
            Automated message sequences that trigger based on fan actions
          </p>
        </div>
        <Button variant="primary" size="md" icon={Plus}>
          New sequence
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active sequences', value: String(activeCount),        icon: Mail,        color: '#8B5CF6' },
          { label: 'Messages sent',    value: formatNumber(totalSent),    icon: Send,        color: '#3B82F6' },
          { label: 'Revenue from seq', value: formatCurrency(totalRevenue), icon: TrendingUp, color: '#10B981' },
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

      {/* Table */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border/40">
                {[
                  { field: 'name'      as SortField, label: 'Sequence'     },
                  { field: null,                      label: 'Trigger'      },
                  { field: null,                      label: 'Steps'        },
                  { field: 'sentTotal' as SortField, label: 'Sent'         },
                  { field: 'openRate'  as SortField, label: 'Open rate'    },
                  { field: 'convRate'  as SortField, label: 'Conv. rate'   },
                  { field: 'revenue'   as SortField, label: 'Revenue'      },
                  { field: null,                      label: 'Status'       },
                ].map(({ field, label }) => (
                  <th
                    key={label}
                    onClick={() => field && toggleSort(field)}
                    className={[
                      'text-left text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5',
                      field ? 'cursor-pointer hover:text-text-secondary transition-colors' : '',
                    ].join(' ')}
                  >
                    <span className="flex items-center gap-1.5">
                      {label}
                      {field && <SortIcon field={field} />}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-2.5 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border/40">
              {rows.map((seq) => {
                const { variant, label } = STATUS_CONFIG[seq.status];
                return (
                  <tr key={seq.id} className="hover:bg-bg-subtle/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{seq.name}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{seq.trigger}</td>
                    <td className="px-4 py-3 text-text-secondary tabular-nums">{seq.messages}</td>
                    <td className="px-4 py-3 text-text-secondary tabular-nums">{formatNumber(seq.sentTotal)}</td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className={seq.openRate >= 60 ? 'text-success-text' : 'text-text-secondary'}>
                        {seq.openRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className={seq.convRate >= 15 ? 'text-success-text' : 'text-text-secondary'}>
                        {seq.convRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-text-primary tabular-nums">
                      {formatCurrency(seq.revenue)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={variant} size="sm">{label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleStatus(seq.id)}
                          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-violet-400 transition-colors"
                        >
                          {seq.status === 'active'
                            ? <><Pause size={11} /> Pause</>
                            : <><Play size={11} /> Start</>
                          }
                        </button>
                        <button type="button" className="text-xs text-text-muted hover:text-violet-400 transition-colors">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
