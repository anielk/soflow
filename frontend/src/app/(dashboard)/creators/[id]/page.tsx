'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Avatar, Badge, Button, EmptyState, Input } from '@/components/ui';
import {
  ArrowLeft, Settings, Users, TrendingUp, BarChart3, FileText,
  CheckCircle2, Globe, Edit3, Wifi,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';
import { getCreator } from '@/lib/mock-creators';
import type { Creator, CreatorStatus } from '@/types/creator';

type Tab = 'overview' | 'profile' | 'employees' | 'settings';

const STATUS_BADGE: Record<CreatorStatus, { variant: 'success' | 'warning' | 'default'; label: string }> = {
  active:   { variant: 'success', label: 'Active'   },
  paused:   { variant: 'warning', label: 'Paused'   },
  inactive: { variant: 'default', label: 'Inactive' },
};

const MOCK_EMPLOYEES = [
  { id: 'emp-jake',  name: 'Jake Davis',   role: 'Chatter',    messages: 1240, revenue: 3200 },
  { id: 'emp-sarah', name: 'Sarah Wilson', role: 'Manager',    messages: 840,  revenue: 2100 },
  { id: 'emp-mike',  name: 'Mike Torres',  role: 'Chatter',    messages: 960,  revenue: 2640 },
];

// ---------- Sub-components ------------------------------------------------

function OverviewTab({ creator }: { creator: Creator }) {
  const stats = [
    { label: 'Subscribers',   value: formatNumber(creator.subscribers),   icon: Users,    color: '#8B5CF6' },
    { label: 'Revenue / mo',  value: formatCurrency(creator.revenueMonth), icon: TrendingUp, color: '#10B981' },
    { label: 'Posts this mo', value: String(creator.postsThisMonth),       icon: FileText,   color: '#3B82F6' },
    { label: 'Total revenue', value: formatCurrency(creator.revenueTotal), icon: BarChart3,  color: '#F59E0B' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 flex items-center gap-3"
          >
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

      {/* Quick info */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-bg-border/40">
          <h3 className="text-sm font-semibold text-text-primary">Account details</h3>
        </div>
        <dl className="divide-y divide-bg-border/40">
          {[
            { label: 'Username',   value: `@${creator.username}` },
            { label: 'Subscription price', value: `€${creator.subscriptionPrice} / month` },
            { label: 'Joined Soflow', value: new Date(creator.joinedAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) },
            { label: 'Assigned employees', value: creator.assignedEmployees.length > 0 ? `${creator.assignedEmployees.length} employees` : 'None' },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-4 px-4 py-2.5">
              <dt className="text-xs text-text-muted w-36 shrink-0 pt-0.5">{label}</dt>
              <dd className="text-sm text-text-primary">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function ProfileTab({ creator }: { creator: Creator }) {
  const [bio,     setBio]     = useState(creator.bio);
  const [price,   setPrice]   = useState(String(creator.subscriptionPrice));
  const [success, setSuccess] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    // TODO: PUT /v1/creators/:id/profile
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Avatar preview */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 flex items-center gap-4">
        <Avatar name={creator.displayName} size="xl" />
        <div>
          <p className="text-sm font-semibold text-text-primary">{creator.displayName}</p>
          <p className="text-xs text-text-muted mt-0.5">@{creator.username}</p>
          <button type="button" className="mt-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
            Change avatar
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {success && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded bg-success-subtle border border-success/20 text-success-text text-sm">
            <CheckCircle2 size={14} />
            Profile saved successfully
          </div>
        )}

        <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 space-y-4">
          <h3 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em]">
            Public profile
          </h3>
          <Input
            label="Display name"
            defaultValue={creator.displayName}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 500))}
              rows={3}
              className="w-full rounded bg-bg-subtle border border-bg-border text-text-primary placeholder:text-text-muted text-sm p-3 resize-none focus:outline-none focus:border-violet-600 transition-colors"
              placeholder="Creator bio…"
            />
            <div className="flex justify-end">
              <span className="text-[11px] text-text-disabled">{bio.length} / 500</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 space-y-4">
          <h3 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em]">
            Subscription settings
          </h3>
          <Input
            label="Monthly subscription price (€)"
            type="number"
            min="1"
            max="499"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            hint="Fans pay this amount to subscribe monthly."
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md">Save changes</Button>
        </div>
      </form>
    </div>
  );
}

function EmployeesTab({ creator }: { creator: Creator }) {
  const assigned = MOCK_EMPLOYEES.filter((e) => creator.assignedEmployees.includes(e.id));

  if (assigned.length === 0) {
    return (
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <EmptyState
          icon={Users}
          title="No employees assigned"
          description="Assign chatters and managers to handle fan interactions for this creator."
          action={{ label: 'Manage employees', href: '/employees' }}
          size="md"
        />
      </div>
    );
  }

  return (
    <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-bg-border/40">
        <h3 className="text-sm font-semibold text-text-primary">Assigned employees</h3>
        <Button variant="secondary" size="sm" icon={Users}>
          Manage
        </Button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bg-border/40">
            {['Employee', 'Role', 'Messages', 'Revenue generated'].map((col) => (
              <th key={col} className="text-left text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-bg-border/40">
          {assigned.map((emp) => (
            <tr key={emp.id} className="hover:bg-bg-subtle/40 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={emp.name} size="sm" />
                  <span className="font-medium text-text-primary">{emp.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-text-secondary">{emp.role}</td>
              <td className="px-4 py-3 text-text-secondary tabular-nums">{formatNumber(emp.messages)}</td>
              <td className="px-4 py-3 font-medium text-text-primary tabular-nums">{formatCurrency(emp.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettingsTab({ creator }: { creator: Creator }) {
  const [proxyHost, setProxyHost] = useState(creator.proxyHost ?? '');
  const [proxyPort, setProxyPort] = useState(String(creator.proxyPort ?? ''));
  const [enabled,   setEnabled]   = useState(creator.proxyEnabled);

  return (
    <div className="max-w-xl space-y-6">
      {/* Proxy config */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-bg-border/40">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Proxy configuration</h3>
            <p className="text-xs text-text-muted mt-0.5">Route OnlyFans traffic through a dedicated IP.</p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={[
              'relative inline-flex h-5 w-9 rounded-full transition-colors duration-200',
              enabled ? 'bg-violet-600' : 'bg-bg-overlay',
            ].join(' ')}
          >
            <span className={[
              'inline-block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-200 mt-[3px]',
              enabled ? 'translate-x-[18px]' : 'translate-x-[3px]',
            ].join(' ')} />
          </button>
        </div>

        <div className={['p-5 space-y-4', !enabled ? 'opacity-40 pointer-events-none' : ''].join(' ')}>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Proxy host / IP"
                type="text"
                value={proxyHost}
                onChange={(e) => setProxyHost(e.target.value)}
                placeholder="185.220.101.45"
                leadingIcon={Globe}
              />
            </div>
            <Input
              label="Port"
              type="number"
              value={proxyPort}
              onChange={(e) => setProxyPort(e.target.value)}
              placeholder="8080"
            />
          </div>

          {creator.proxyEnabled && creator.proxyLastVerified && (
            <div className="flex items-center gap-2 text-xs text-success-text">
              <CheckCircle2 size={12} />
              <span>
                Last verified {new Date(creator.proxyLastVerified).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="secondary" size="sm" icon={Wifi}>
              Test connection
            </Button>
            <Button variant="primary" size="sm">
              Save proxy
            </Button>
          </div>
        </div>
      </div>

      {/* Danger */}
      <div className="bg-bg-surface border border-danger/20 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-danger-text mb-1">Remove creator</h3>
        <p className="text-xs text-text-muted mb-3">
          This will disconnect the creator from your agency. All historical data is retained.
        </p>
        <Button variant="danger" size="sm">Remove from agency</Button>
      </div>
    </div>
  );
}

// ---------- Main page -------------------------------------------------------

export default function CreatorDetailPage() {
  const router  = useRouter();
  const params  = useParams<{ id: string }>();
  const [tab,   setTab]   = useState<Tab>('overview');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
    else setReady(true);
  }, [router]);

  const creator: Creator | undefined = params?.id ? getCreator(params.id) : undefined;

  if (!ready) return null;

  if (!creator) {
    return (
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <EmptyState
          icon={Users}
          title="Creator not found"
          description="This creator doesn't exist or has been removed."
          action={{ label: 'Back to creators', href: '/creators' }}
          size="lg"
        />
      </div>
    );
  }

  const { variant, label } = STATUS_BADGE[creator.status];

  const TABS: { value: Tab; label: string }[] = [
    { value: 'overview',   label: 'Overview'   },
    { value: 'profile',    label: 'Profile'    },
    { value: 'employees',  label: 'Employees'  },
    { value: 'settings',   label: 'Settings'   },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + header */}
      <div>
        <button
          type="button"
          onClick={() => router.push('/creators')}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft size={13} />
          All creators
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={creator.displayName} size="xl" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-semibold text-text-primary">{creator.displayName}</h1>
                <Badge variant={variant} size="sm">{label}</Badge>
              </div>
              <p className="text-sm text-text-muted mt-0.5">@{creator.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={Edit3} onClick={() => setTab('profile')}>
              Edit profile
            </Button>
            <Button variant="secondary" size="sm" icon={Settings} onClick={() => setTab('settings')}>
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-bg-border/40">
        {TABS.map(({ value, label: tabLabel }) => (
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
            {tabLabel}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview'  && <OverviewTab   creator={creator} />}
      {tab === 'profile'   && <ProfileTab    creator={creator} />}
      {tab === 'employees' && <EmployeesTab  creator={creator} />}
      {tab === 'settings'  && <SettingsTab   creator={creator} />}
    </div>
  );
}
