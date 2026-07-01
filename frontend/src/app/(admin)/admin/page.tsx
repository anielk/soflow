'use client';

import {
  ShieldAlert, Building2, Users, Layers, Plug, TrendingUp,
  CreditCard, Bot, HardDrive, AlertCircle, CheckCircle2,
  Clock, UserPlus, RefreshCw, Inbox, Zap,
} from 'lucide-react';

const STAT_CARDS = [
  { label: 'Total Customers',       value: '—', icon: Building2,   color: '#10B981', sub: 'Paying accounts'         },
  { label: 'Active Workspaces',     value: '—', icon: Layers,      color: '#8B5CF6', sub: 'Across all customers'    },
  { label: 'Active Users',          value: '—', icon: Users,       color: '#3B82F6', sub: 'Logged in last 30 days'  },
  { label: 'Connected Platforms',   value: '—', icon: Plug,        color: '#EC4899', sub: 'Active integrations'     },
  { label: 'AI Requests Today',     value: '—', icon: Bot,         color: '#F59E0B', sub: 'All workspaces'          },
  { label: 'Storage Used',          value: '—', icon: HardDrive,   color: '#06B6D4', sub: 'Total platform storage'  },
  { label: 'Revenue (MRR)',         value: '—', icon: TrendingUp,  color: '#10B981', sub: 'Monthly recurring'       },
  { label: 'Active Subscriptions',  value: '—', icon: CreditCard,  color: '#6366F1', sub: 'Paid plans'              },
];

const RECENT_REGISTRATIONS = [
  { workspace: 'EliteCreators Agency', plan: 'Pro',      time: '2 min ago'  },
  { workspace: 'NordContent B.V.',     plan: 'Starter',  time: '41 min ago' },
  { workspace: 'PremiumFans GmbH',     plan: 'Pro',      time: '1h ago'     },
  { workspace: 'Visionary Media LLC',  plan: 'Free',     time: '3h ago'     },
  { workspace: 'Creator Hub NL',       plan: 'Enterprise', time: '5h ago'   },
];

const SYSTEM_EVENTS = [
  { type: 'info',  icon: UserPlus,    msg: 'New workspace registered: EliteCreators Agency',  time: '2m'  },
  { type: 'info',  icon: Plug,        msg: 'OnlyFans connector connected — workspace #1042',   time: '15m' },
  { type: 'warn',  icon: AlertCircle, msg: 'SMTP delivery failure — retry queued',              time: '38m' },
  { type: 'info',  icon: RefreshCw,   msg: 'Scheduled Prisma migrate deploy succeeded',         time: '1h'  },
  { type: 'info',  icon: CreditCard,  msg: 'Subscription upgraded: NordContent → Pro',          time: '2h'  },
];

const HEALTH_ITEMS = [
  { name: 'Backend',    status: 'healthy' as const },
  { name: 'Database',   status: 'healthy' as const },
  { name: 'Redis',      status: 'healthy' as const },
  { name: 'Queue',      status: 'healthy' as const },
  { name: 'SMTP',       status: 'warning' as const },
  { name: 'AI Server',  status: 'offline' as const },
];

const QUEUE_ITEMS = [
  { name: 'Email',          pending: 3,  failed: 1 },
  { name: 'Notifications',  pending: 0,  failed: 0 },
  { name: 'AI Jobs',        pending: 0,  failed: 0 },
];

const STATUS_COLORS = {
  healthy: { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Healthy' },
  warning: { dot: 'bg-amber-400',   text: 'text-amber-400',   label: 'Warning' },
  offline: { dot: 'bg-red-400',     text: 'text-red-400',     label: 'Offline' },
};

const EVENT_COLORS: Record<string, string> = {
  info: 'text-text-muted',
  warn: 'text-amber-400',
  error: 'text-red-400',
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' }}
        >
          <ShieldAlert size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Platform Administration</h1>
          <p className="text-sm text-text-muted">Leinaflow internal operations dashboard</p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 bg-red-600/10 border border-red-500/20 rounded-xl p-4">
        <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-300">SUPER_ADMIN area</p>
          <p className="text-xs text-text-muted mt-0.5">
            You are in the platform administration area. Actions here affect all workspaces and customers.
          </p>
        </div>
      </div>

      {/* 8 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-bg-surface border border-bg-border/60 rounded-xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                <Icon size={14} style={{ color }} />
              </div>
              <p className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] leading-tight">{label}</p>
            </div>
            <p className="text-2xl font-bold text-text-primary tabular-nums">{value}</p>
            <p className="text-xs text-text-muted mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent registrations + System events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent registrations */}
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
          <div className="border-b border-bg-border/40 px-4 py-3 flex items-center gap-2">
            <UserPlus size={13} className="text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">Recent registrations</h2>
          </div>
          <div className="divide-y divide-bg-border/40">
            {RECENT_REGISTRATIONS.map((r) => (
              <div key={r.workspace} className="flex items-center justify-between px-4 py-3 hover:bg-bg-subtle/30 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{r.workspace}</p>
                  <span className={[
                    'text-[10px] font-medium px-1.5 py-0.5 rounded',
                    r.plan === 'Enterprise' ? 'bg-violet-600/15 text-violet-400' :
                    r.plan === 'Pro'        ? 'bg-blue-600/15 text-blue-400' :
                    r.plan === 'Starter'    ? 'bg-emerald-600/15 text-emerald-400' :
                                             'bg-bg-subtle text-text-disabled',
                  ].join(' ')}>
                    {r.plan}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-text-disabled shrink-0 ml-3">
                  <Clock size={11} />
                  {r.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System events */}
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
          <div className="border-b border-bg-border/40 px-4 py-3 flex items-center gap-2">
            <Zap size={13} className="text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">System events</h2>
          </div>
          <div className="divide-y divide-bg-border/40">
            {SYSTEM_EVENTS.map((ev, i) => {
              const Icon = ev.icon;
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-bg-subtle/30 transition-colors">
                  <Icon size={13} className={`mt-0.5 shrink-0 ${EVENT_COLORS[ev.type]}`} />
                  <p className="text-xs text-text-secondary flex-1 leading-relaxed">{ev.msg}</p>
                  <span className="text-[11px] text-text-disabled shrink-0">{ev.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Server health + Queue status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Server health overview */}
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
          <div className="border-b border-bg-border/40 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-text-primary">Server health</h2>
            </div>
            <a href="/admin/infrastructure" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
              View all
            </a>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {HEALTH_ITEMS.map(({ name, status }) => {
              const s = STATUS_COLORS[status];
              return (
                <div key={name} className="flex items-center gap-2 px-3 py-2.5 bg-bg-subtle/50 rounded-lg">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                  <span className="text-xs text-text-secondary flex-1">{name}</span>
                  <span className={`text-[11px] font-medium ${s.text}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Queue status */}
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
          <div className="border-b border-bg-border/40 px-4 py-3 flex items-center gap-2">
            <Inbox size={13} className="text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">Queue status</h2>
          </div>
          <div className="divide-y divide-bg-border/40">
            {QUEUE_ITEMS.map((q) => (
              <div key={q.name} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-text-secondary">{q.name}</span>
                <div className="flex items-center gap-4 text-xs tabular-nums">
                  <span className="text-text-muted">
                    <span className="text-text-secondary font-medium">{q.pending}</span> pending
                  </span>
                  <span className={q.failed > 0 ? 'text-red-400 font-medium' : 'text-text-disabled'}>
                    {q.failed} failed
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-bg-border/40">
            <p className="text-[11px] text-text-disabled">Queue API not yet connected — values are illustrative.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
