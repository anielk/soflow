'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Avatar, Badge, Button } from '@/components/ui';
import { UserPlus, Search, ChevronUp, ChevronDown, Users, TrendingUp, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';
import { MOCK_CREATORS } from '@/lib/mock-creators';
import type { Creator, CreatorStatus } from '@/types/creator';

type SortField    = 'displayName' | 'subscribers' | 'revenueMonth' | 'postsThisMonth';
type SortDir      = 'asc' | 'desc';
type StatusFilter = 'all' | CreatorStatus;

const STATUS_BADGE: Record<CreatorStatus, { variant: 'success' | 'warning' | 'default'; label: string }> = {
  active:   { variant: 'success', label: 'Active'   },
  paused:   { variant: 'warning', label: 'Paused'   },
  inactive: { variant: 'default', label: 'Inactive' },
};

const totalSubs    = MOCK_CREATORS.reduce((a, c) => a + c.subscribers, 0);
const totalRevenue = MOCK_CREATORS.reduce((a, c) => a + c.revenueMonth, 0);
const activeCount  = MOCK_CREATORS.filter((c) => c.status === 'active').length;

export default function ManageCreatorsPage() {
  const router = useRouter();
  const [query,        setQuery]        = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField,    setSortField]    = useState<SortField>('revenueMonth');
  const [sortDir,      setSortDir]      = useState<SortDir>('desc');

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  const rows: Creator[] = [...MOCK_CREATORS]
    .filter((c) => statusFilter === 'all' || c.status === statusFilter)
    .filter((c) =>
      c.displayName.toLowerCase().includes(query.toLowerCase()) ||
      c.username.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => {
      const av = a[sortField] ?? 0;
      const bv = b[sortField] ?? 0;
      const cmp = typeof av === 'string'
        ? av.localeCompare(String(bv))
        : (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp size={12} className="text-text-disabled/40" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-violet-400" />
      : <ChevronDown size={12} className="text-violet-400" />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Creators</h1>
          <p className="mt-1 text-sm text-text-muted">
            {MOCK_CREATORS.length} creators · {activeCount} active
          </p>
        </div>
        <Button variant="primary" size="md" icon={UserPlus}>
          Add creator
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total subscribers', value: formatNumber(totalSubs),      icon: Users,    color: '#8B5CF6' },
          { label: 'Revenue this month', value: formatCurrency(totalRevenue), icon: TrendingUp, color: '#10B981' },
          { label: 'Active creators',    value: String(activeCount),           icon: BarChart3,  color: '#3B82F6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-disabled">{label}</p>
              <p className="mt-0.5 text-lg font-bold text-text-primary tabular-nums leading-none">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-bg-border/40 flex-wrap">
          {/* Status filter */}
          <div className="flex items-center gap-1">
            {(['all', 'active', 'paused', 'inactive'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={[
                  'px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors duration-150',
                  statusFilter === s
                    ? 'bg-violet-600/15 text-violet-400'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-subtle',
                ].join(' ')}
              >
                {s === 'all' ? 'All' : STATUS_BADGE[s].label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 px-3 h-8 bg-bg-subtle border border-bg-border/60 rounded-lg flex-1 min-w-[160px] max-w-sm ml-auto">
            <Search size={13} className="text-text-muted shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search creators…"
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border/40">
                {[
                  { field: 'displayName'    as const, label: 'Creator'       },
                  { field: null,                       label: 'Status'        },
                  { field: 'subscribers'    as const, label: 'Subscribers'   },
                  { field: 'revenueMonth'   as const, label: 'Revenue / mo'  },
                  { field: 'postsThisMonth' as const, label: 'Posts'         },
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
                <th className="text-left text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5">
                  Last post
                </th>
                <th className="px-4 py-2.5 w-24" />
              </tr>
            </thead>

            <tbody className="divide-y divide-bg-border/40">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-text-muted">
                    No creators match your filters
                  </td>
                </tr>
              )}
              {rows.map((creator) => {
                const { variant, label } = STATUS_BADGE[creator.status];
                const deltaPositive = creator.subscribersDelta >= 0;
                return (
                  <tr
                    key={creator.id}
                    className="hover:bg-bg-subtle/40 transition-colors duration-100 cursor-pointer"
                    onClick={() => router.push(`/creators/${creator.id}`)}
                  >
                    {/* Creator */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={creator.displayName} size="sm" />
                        <div>
                          <p className="font-semibold text-text-primary">{creator.displayName}</p>
                          <p className="text-xs text-text-muted">@{creator.username}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge variant={variant} size="sm">{label}</Badge>
                    </td>

                    {/* Subscribers */}
                    <td className="px-4 py-3">
                      <p className="text-text-primary tabular-nums font-medium">
                        {formatNumber(creator.subscribers)}
                      </p>
                      <div className={[
                        'flex items-center gap-0.5 text-[11px] tabular-nums',
                        deltaPositive ? 'text-success-text' : 'text-danger-text',
                      ].join(' ')}>
                        {deltaPositive
                          ? <ArrowUpRight size={10} />
                          : <ArrowDownRight size={10} />
                        }
                        {Math.abs(creator.subscribersDelta)} this month
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="px-4 py-3 font-semibold text-text-primary tabular-nums">
                      {creator.status === 'paused' ? (
                        <span className="text-text-muted">—</span>
                      ) : (
                        formatCurrency(creator.revenueMonth)
                      )}
                    </td>

                    {/* Posts */}
                    <td className="px-4 py-3 text-text-secondary tabular-nums">
                      {creator.postsThisMonth}
                    </td>

                    {/* Last post */}
                    <td className="px-4 py-3 text-text-muted text-xs">
                      {creator.lastPostAt
                        ? new Date(creator.lastPostAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short',
                          })
                        : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-xs text-text-muted hover:text-violet-400 transition-colors"
                        onClick={(e) => { e.stopPropagation(); router.push(`/creators/${creator.id}`); }}
                      >
                        View
                      </button>
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
