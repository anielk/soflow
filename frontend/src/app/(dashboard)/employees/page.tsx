'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Avatar, Badge, Button } from '@/components/ui';
import {
  UserPlus, Search, ChevronUp, ChevronDown,
  MessageSquare, TrendingUp, Users, Clock,
} from 'lucide-react';
import { formatCurrency, formatNumber, relativeTime } from '@/lib/format';
import { MOCK_EMPLOYEES } from '@/lib/mock-employees';
import type { Employee, EmployeeRole, EmployeeStatus } from '@/types/employee';

type SortField    = 'name' | 'messagesThisMonth' | 'revenueGenerated' | 'avgResponseMin';
type SortDir      = 'asc' | 'desc';
type RoleFilter   = 'all' | EmployeeRole;
type StatusFilter = 'all' | EmployeeStatus;

const ROLE_BADGE: Record<EmployeeRole, string> = {
  chatter: 'Chatter',
  manager: 'Manager',
  admin:   'Admin',
};

const totalMessages = MOCK_EMPLOYEES.reduce((a, e) => a + e.messagesThisMonth, 0);
const totalRevenue  = MOCK_EMPLOYEES.reduce((a, e) => a + e.revenueGenerated,  0);
const activeCount   = MOCK_EMPLOYEES.filter((e) => e.status === 'active').length;
const avgResponse   = Math.round(
  MOCK_EMPLOYEES.filter((e) => e.avgResponseMin > 0).reduce((a, e) => a + e.avgResponseMin, 0) /
  MOCK_EMPLOYEES.filter((e) => e.avgResponseMin > 0).length,
);

export default function EmployeesPage() {
  const router = useRouter();
  const [query,        setQuery]        = useState('');
  const [roleFilter,   setRoleFilter]   = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField,    setSortField]    = useState<SortField>('revenueGenerated');
  const [sortDir,      setSortDir]      = useState<SortDir>('desc');

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp size={12} className="text-text-disabled/40" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-violet-400" />
      : <ChevronDown size={12} className="text-violet-400" />;
  }

  const rows: Employee[] = [...MOCK_EMPLOYEES]
    .filter((e) => roleFilter === 'all' || e.role === roleFilter)
    .filter((e) => statusFilter === 'all' || e.status === statusFilter)
    .filter((e) => e.name.toLowerCase().includes(query.toLowerCase()) ||
                   e.email.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortField] ?? 0;
      const bv = b[sortField] ?? 0;
      const cmp = typeof av === 'string'
        ? av.localeCompare(String(bv))
        : (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Employees</h1>
          <p className="mt-1 text-sm text-text-muted">
            {MOCK_EMPLOYEES.length} team members · {activeCount} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={() => router.push('/employees/schedule')}>
            View schedule
          </Button>
          <Button variant="primary" size="md" icon={UserPlus}>
            Add employee
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total messages',  value: formatNumber(totalMessages), icon: MessageSquare, color: '#8B5CF6' },
          { label: 'Revenue generated', value: formatCurrency(totalRevenue), icon: TrendingUp, color: '#10B981' },
          { label: 'Active employees', value: String(activeCount),         icon: Users,         color: '#3B82F6' },
          { label: 'Avg response',     value: `${avgResponse} min`,        icon: Clock,         color: '#F59E0B' },
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

      {/* Table */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-bg-border/40 flex-wrap">
          {/* Role filter */}
          <div className="flex items-center gap-1">
            {(['all', 'chatter', 'manager', 'admin'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={[
                  'px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors duration-150',
                  roleFilter === r
                    ? 'bg-violet-600/15 text-violet-400'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-subtle',
                ].join(' ')}
              >
                {r === 'all' ? 'All roles' : ROLE_BADGE[r]}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1">
            {(['all', 'active', 'inactive'] as const).map((s) => (
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
                {s === 'all' ? 'All status' : s.charAt(0).toUpperCase() + s.slice(1)}
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
              placeholder="Search employees…"
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border/40">
                {[
                  { field: 'name' as const,             label: 'Employee'      },
                  { field: null,                          label: 'Role'          },
                  { field: null,                          label: 'Status'        },
                  { field: 'messagesThisMonth' as const, label: 'Messages'      },
                  { field: 'revenueGenerated'  as const, label: 'Revenue gen.'  },
                  { field: 'avgResponseMin'    as const, label: 'Avg response'  },
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
                  Last active
                </th>
                <th className="px-4 py-2.5 w-20" />
              </tr>
            </thead>

            <tbody className="divide-y divide-bg-border/40">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-text-muted">
                    No employees match your filters
                  </td>
                </tr>
              )}
              {rows.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-bg-subtle/40 transition-colors duration-100 cursor-pointer"
                  onClick={() => router.push(`/employees/${emp.id}`)}
                >
                  {/* Employee */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={emp.name} size="sm" />
                      <div>
                        <p className="font-semibold text-text-primary">{emp.name}</p>
                        <p className="text-xs text-text-muted">{emp.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    <Badge
                      variant={emp.role === 'admin' ? 'violet' : emp.role === 'manager' ? 'default' : 'default'}
                      size="sm"
                    >
                      {ROLE_BADGE[emp.role]}
                    </Badge>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <Badge variant={emp.status === 'active' ? 'success' : 'default'} size="sm">
                      {emp.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>

                  {/* Messages */}
                  <td className="px-4 py-3 text-text-secondary tabular-nums">
                    {formatNumber(emp.messagesThisMonth)}
                  </td>

                  {/* Revenue */}
                  <td className="px-4 py-3 font-semibold text-text-primary tabular-nums">
                    {emp.revenueGenerated > 0 ? formatCurrency(emp.revenueGenerated) : '—'}
                  </td>

                  {/* Avg response */}
                  <td className="px-4 py-3 text-text-secondary tabular-nums">
                    {emp.avgResponseMin > 0 ? `${emp.avgResponseMin} min` : '—'}
                  </td>

                  {/* Last active */}
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {emp.lastActiveAt ? relativeTime(emp.lastActiveAt) : '—'}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-xs text-text-muted hover:text-violet-400 transition-colors"
                      onClick={(e) => { e.stopPropagation(); router.push(`/employees/${emp.id}`); }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
