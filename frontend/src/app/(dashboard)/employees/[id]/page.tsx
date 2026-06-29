'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Avatar, Badge, Button, EmptyState } from '@/components/ui';
import {
  ArrowLeft, MessageSquare, TrendingUp, Clock, Users,
  Calendar, Settings, Edit3,
} from 'lucide-react';
import { formatCurrency, formatNumber, relativeTime } from '@/lib/format';
import { getEmployee, MOCK_SHIFTS } from '@/lib/mock-employees';
import { MOCK_CREATORS } from '@/lib/mock-creators';
import type { Employee, EmployeeRole } from '@/types/employee';

type Tab = 'overview' | 'creators' | 'shifts' | 'settings';

const ROLE_LABEL: Record<EmployeeRole, string> = {
  chatter: 'Chatter',
  manager: 'Manager',
  admin:   'Admin',
};

function OverviewTab({ employee }: { employee: Employee }) {
  const stats = [
    { label: 'Messages / mo',  value: formatNumber(employee.messagesThisMonth), icon: MessageSquare, color: '#8B5CF6' },
    { label: 'Revenue gen.',   value: formatCurrency(employee.revenueGenerated), icon: TrendingUp,   color: '#10B981' },
    { label: 'Avg response',   value: employee.avgResponseMin > 0 ? `${employee.avgResponseMin} min` : '—', icon: Clock, color: '#F59E0B' },
    { label: 'Creators',       value: String(employee.creatorsManaged.length),   icon: Users,        color: '#3B82F6' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
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

      {/* Account details */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-bg-border/40">
          <h3 className="text-sm font-semibold text-text-primary">Account details</h3>
        </div>
        <dl className="divide-y divide-bg-border/40">
          {[
            { label: 'Email',       value: employee.email },
            { label: 'Role',        value: ROLE_LABEL[employee.role] },
            { label: 'Joined',      value: new Date(employee.joinedAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) },
            { label: 'Last active', value: employee.lastActiveAt ? relativeTime(employee.lastActiveAt) : 'Never' },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-4 px-4 py-2.5">
              <dt className="text-xs text-text-muted w-28 shrink-0 pt-0.5">{label}</dt>
              <dd className="text-sm text-text-primary">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function CreatorsTab({ employee }: { employee: Employee }) {
  const creators = MOCK_CREATORS.filter((c) => employee.creatorsManaged.includes(c.id));

  if (creators.length === 0) {
    return (
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <EmptyState
          icon={Users}
          title="No creators assigned"
          description="This employee has not been assigned to manage any creators yet."
          action={{ label: 'Manage creators', href: '/creators' }}
          size="md"
        />
      </div>
    );
  }

  return (
    <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-bg-border/40">
        <h3 className="text-sm font-semibold text-text-primary">Assigned creators</h3>
        <Badge variant="default" size="sm">{creators.length}</Badge>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bg-border/40">
            {['Creator', 'Status', 'Subscribers', 'Revenue / mo'].map((col) => (
              <th key={col} className="text-left text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-bg-border/40">
          {creators.map((c) => (
            <tr
              key={c.id}
              className="hover:bg-bg-subtle/40 transition-colors cursor-pointer"
              onClick={() => window.location.href = `/creators/${c.id}`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={c.displayName} size="sm" />
                  <div>
                    <p className="font-medium text-text-primary">{c.displayName}</p>
                    <p className="text-xs text-text-muted">@{c.username}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge variant={c.status === 'active' ? 'success' : 'warning'} size="sm">
                  {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                </Badge>
              </td>
              <td className="px-4 py-3 text-text-secondary tabular-nums">{formatNumber(c.subscribers)}</td>
              <td className="px-4 py-3 font-semibold text-text-primary tabular-nums">{formatCurrency(c.revenueMonth)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ShiftsTab({ employee }: { employee: Employee }) {
  const shifts = MOCK_SHIFTS.filter((s) => s.employeeId === employee.id);

  if (shifts.length === 0) {
    return (
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <EmptyState
          icon={Calendar}
          title="No shifts scheduled"
          description="This employee has no upcoming or recent shifts."
          action={{ label: 'View schedule', href: '/employees/schedule' }}
          size="md"
        />
      </div>
    );
  }

  return (
    <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-bg-border/40">
        <h3 className="text-sm font-semibold text-text-primary">Shifts</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bg-border/40">
            {['Date', 'Start', 'End', 'Status', 'Creators'].map((col) => (
              <th key={col} className="text-left text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-bg-border/40">
          {shifts.map((s) => (
            <tr key={s.id} className="hover:bg-bg-subtle/40 transition-colors">
              <td className="px-4 py-3 text-text-secondary text-xs">
                {new Date(s.startAt).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
              </td>
              <td className="px-4 py-3 text-text-secondary tabular-nums text-xs">
                {new Date(s.startAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="px-4 py-3 text-text-secondary tabular-nums text-xs">
                {new Date(s.endAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={s.status === 'in_progress' ? 'success' : s.status === 'missed' ? 'danger' : 'default'}
                  size="sm"
                >
                  {s.status.replace('_', ' ')}
                </Badge>
              </td>
              <td className="px-4 py-3 text-text-muted text-xs">
                {s.creatorsAssigned.length > 0 ? s.creatorsAssigned.join(', ') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettingsTab({ employee }: { employee: Employee }) {
  const [status, setStatus] = useState(employee.status === 'active');

  return (
    <div className="max-w-xl space-y-6">
      {/* Status */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text-primary">Account status</p>
            <p className="text-xs text-text-muted mt-0.5">
              Deactivating an employee prevents them from logging in.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStatus((v) => !v)}
            className={[
              'relative inline-flex h-5 w-9 rounded-full transition-colors duration-200',
              status ? 'bg-violet-600' : 'bg-bg-overlay',
            ].join(' ')}
          >
            <span className={[
              'inline-block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-200 mt-[3px]',
              status ? 'translate-x-[18px]' : 'translate-x-[3px]',
            ].join(' ')} />
          </button>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Permissions</h3>
        {[
          { label: 'Send messages',   desc: 'Chat with fans via managed creator accounts' },
          { label: 'Create posts',    desc: 'Schedule and publish content' },
          { label: 'View analytics',  desc: 'Access creator statistics and reports' },
          { label: 'Manage fans',     desc: 'Block, unblock and manage fan lists' },
        ].map(({ label, desc }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-bg-border/40 last:border-0">
            <div>
              <p className="text-sm text-text-primary">{label}</p>
              <p className="text-xs text-text-muted">{desc}</p>
            </div>
            <div className="w-9 h-5 rounded-full bg-violet-600 relative shrink-0">
              <span className="absolute right-[3px] top-[3px] w-3.5 h-3.5 bg-white rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Danger */}
      <div className="bg-bg-surface border border-danger/20 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-danger-text mb-1">Remove employee</h3>
        <p className="text-xs text-text-muted mb-3">
          This will permanently remove the employee from your agency. All historical data is retained.
        </p>
        <Button variant="danger" size="sm">Remove employee</Button>
      </div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [tab,   setTab]   = useState<Tab>('overview');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
    else setReady(true);
  }, [router]);

  const employee: Employee | undefined = params?.id ? getEmployee(params.id) : undefined;

  if (!ready) return null;

  if (!employee) {
    return (
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <EmptyState
          icon={Users}
          title="Employee not found"
          description="This employee does not exist or has been removed."
          action={{ label: 'Back to employees', href: '/employees' }}
          size="lg"
        />
      </div>
    );
  }

  const TABS: { value: Tab; label: string }[] = [
    { value: 'overview',  label: 'Overview'  },
    { value: 'creators',  label: 'Creators'  },
    { value: 'shifts',    label: 'Shifts'    },
    { value: 'settings',  label: 'Settings'  },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + header */}
      <div>
        <button
          type="button"
          onClick={() => router.push('/employees')}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft size={13} />
          All employees
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={employee.name} size="xl" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-semibold text-text-primary">{employee.name}</h1>
                <Badge variant={employee.status === 'active' ? 'success' : 'default'} size="sm">
                  {employee.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm text-text-muted mt-0.5">
                {ROLE_LABEL[employee.role]} · {employee.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={Edit3} onClick={() => setTab('settings')}>
              Edit
            </Button>
            <Button variant="secondary" size="sm" icon={Settings} onClick={() => setTab('settings')}>
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-bg-border/40">
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={[
              'px-4 py-2 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px',
              tab === value
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-text-muted hover:text-text-secondary',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview'  && <OverviewTab  employee={employee} />}
      {tab === 'creators'  && <CreatorsTab  employee={employee} />}
      {tab === 'shifts'    && <ShiftsTab    employee={employee} />}
      {tab === 'settings'  && <SettingsTab  employee={employee} />}
    </div>
  );
}
