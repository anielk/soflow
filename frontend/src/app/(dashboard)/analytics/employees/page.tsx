'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Avatar, Badge } from '@/components/ui';
import { MessageSquare, TrendingUp, Clock, Users } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';
import { MOCK_EMPLOYEES } from '@/lib/mock-employees';

const totalMessages = MOCK_EMPLOYEES.reduce((a, e) => a + e.messagesThisMonth, 0);
const totalRevenue  = MOCK_EMPLOYEES.reduce((a, e) => a + e.revenueGenerated,  0);
const activeCount   = MOCK_EMPLOYEES.filter((e) => e.status === 'active').length;
const avgResponse   = Math.round(
  MOCK_EMPLOYEES.filter((e) => e.avgResponseMin > 0).reduce((a, e) => a + e.avgResponseMin, 0) /
  MOCK_EMPLOYEES.filter((e) => e.avgResponseMin > 0).length,
);

const ROLE_LABEL: Record<string, string> = { chatter: 'Chatter', manager: 'Manager', admin: 'Admin' };

export default function EmployeeReportsPage() {
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
          <span className="text-text-secondary">Employee reports</span>
        </div>
        <h1 className="text-xl font-semibold text-text-primary">Employee reports</h1>
        <p className="mt-1 text-sm text-text-muted">Productivity and revenue metrics by team member</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Messages sent',    value: formatNumber(totalMessages), icon: MessageSquare, color: '#8B5CF6' },
          { label: 'Revenue generated', value: formatCurrency(totalRevenue), icon: TrendingUp,  color: '#10B981' },
          { label: 'Active employees', value: String(activeCount),          icon: Users,        color: '#3B82F6' },
          { label: 'Avg response',     value: `${avgResponse} min`,         icon: Clock,        color: '#F59E0B' },
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

      {/* Employee table */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-bg-border/40">
          <h2 className="text-sm font-semibold text-text-primary">Performance by employee</h2>
          <p className="text-xs text-text-muted mt-0.5">Current month · sorted by revenue generated</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border/40">
                {['Employee', 'Role', 'Status', 'Messages', 'Revenue gen.', 'Avg response', 'Creators'].map((col) => (
                  <th key={col} className="text-left text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border/40">
              {[...MOCK_EMPLOYEES].sort((a, b) => b.revenueGenerated - a.revenueGenerated).map((emp, i) => (
                <tr
                  key={emp.id}
                  className="hover:bg-bg-subtle/40 transition-colors cursor-pointer"
                  onClick={() => router.push(`/employees/${emp.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-text-disabled w-4 text-right tabular-nums">{i + 1}</span>
                      <Avatar name={emp.name} size="sm" />
                      <div>
                        <p className="font-medium text-text-primary">{emp.name}</p>
                        <p className="text-xs text-text-muted">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{ROLE_LABEL[emp.role]}</td>
                  <td className="px-4 py-3">
                    <Badge variant={emp.status === 'active' ? 'success' : 'default'} size="sm">
                      {emp.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums">{formatNumber(emp.messagesThisMonth)}</td>
                  <td className="px-4 py-3 font-semibold text-text-primary tabular-nums">
                    {emp.revenueGenerated > 0 ? formatCurrency(emp.revenueGenerated) : '—'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums text-xs">
                    {emp.avgResponseMin > 0 ? `${emp.avgResponseMin} min` : '—'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums">{emp.creatorsManaged.length}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-bg-border/60 bg-bg-subtle/20">
                <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-text-secondary">Total</td>
                <td className="px-4 py-3 text-xs font-semibold text-text-primary tabular-nums">{formatNumber(totalMessages)}</td>
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
