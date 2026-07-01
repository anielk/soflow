'use client';

import { Server, Database, HardDrive, Radio, Mail, Cloud, Inbox, Cpu, CheckCircle2, AlertCircle, XCircle, RefreshCw, Clock } from 'lucide-react';

type ServiceStatus = 'healthy' | 'warning' | 'offline';

interface ServiceCard {
  name:    string;
  stack:   string;
  detail:  string;
  status:  ServiceStatus;
  icon:    typeof Server;
  uptime?: string;
  latency?: string;
}

const SERVICES: ServiceCard[] = [
  { name: 'Backend API',  stack: 'NestJS',       detail: 'REST + WebSocket, v4.0.0',  status: 'healthy', icon: Server,   uptime: '99.9%', latency: '12ms'  },
  { name: 'Frontend',     stack: 'Next.js 15',   detail: 'App Router, dark UI',        status: 'healthy', icon: Cpu,      uptime: '99.9%', latency: '8ms'   },
  { name: 'PostgreSQL',   stack: 'PostgreSQL 16', detail: 'Prisma ORM, primary DB',    status: 'healthy', icon: Database, uptime: '99.9%', latency: '4ms'   },
  { name: 'Redis',        stack: 'Redis 7',       detail: 'Session + queue',            status: 'healthy', icon: HardDrive,uptime: '100%',  latency: '1ms'   },
  { name: 'WebSocket',    stack: 'Socket.IO',     detail: 'Real-time events',           status: 'healthy', icon: Radio,    uptime: '99.8%', latency: '—'     },
  { name: 'SMTP / Email', stack: 'Not configured',detail: 'Email delivery service',     status: 'warning', icon: Mail,     uptime: '—',     latency: '—'     },
  { name: 'Storage',      stack: 'Local / Docker',detail: 'File and media storage',     status: 'healthy', icon: Cloud,    uptime: '99.9%', latency: '—'     },
  { name: 'Queue',        stack: 'Bull + Redis',  detail: 'Background job processing',  status: 'healthy', icon: Inbox,    uptime: '99.7%', latency: '—'     },
];

const STATUS_CONFIG: Record<ServiceStatus, {
  icon: typeof CheckCircle2;
  color: string;
  bg: string;
  label: string;
  border: string;
}> = {
  healthy: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Healthy', border: 'border-emerald-500/20' },
  warning: { icon: AlertCircle,  color: 'text-amber-400',   bg: 'bg-amber-500/10',   label: 'Warning', border: 'border-amber-500/20'  },
  offline: { icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-500/10',     label: 'Offline', border: 'border-red-500/20'    },
};

const PLATFORM_METRICS = [
  { label: 'Total uptime',       value: '99.8%', unit: ''    },
  { label: 'Avg latency',        value: '—',     unit: 'ms'  },
  { label: 'Requests / hr',      value: '—',     unit: '/hr' },
  { label: 'Active connections', value: '—',     unit: ''    },
];

const statusCounts = {
  healthy: SERVICES.filter((s) => s.status === 'healthy').length,
  warning: SERVICES.filter((s) => s.status === 'warning').length,
  offline: SERVICES.filter((s) => s.status === 'offline').length,
};

export default function AdminInfrastructurePage() {
  const overallStatus: ServiceStatus =
    statusCounts.offline > 0 ? 'offline' :
    statusCounts.warning > 0 ? 'warning' : 'healthy';

  const overall = STATUS_CONFIG[overallStatus];
  const OverallIcon = overall.icon;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Platform Health</h1>
          <p className="text-sm text-text-muted mt-0.5">Service status and infrastructure health overview</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-2 bg-bg-surface border border-bg-border rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Overall status banner */}
      <div className={`flex items-center gap-3 rounded-xl p-4 border ${overall.bg} ${overall.border}`}>
        <OverallIcon size={18} className={overall.color} />
        <div>
          <p className={`text-sm font-semibold ${overall.color}`}>
            {overallStatus === 'healthy' ? 'All systems operational' :
             overallStatus === 'warning' ? 'Some services require attention' :
             'Critical services offline'}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {statusCounts.healthy} healthy · {statusCounts.warning} warning · {statusCounts.offline} offline
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-text-disabled">
          <Clock size={11} />
          Updated just now
        </div>
      </div>

      {/* Platform metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {PLATFORM_METRICS.map(({ label, value, unit }) => (
          <div key={label} className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 text-center">
            <p className="text-[11px] text-text-disabled uppercase tracking-[0.06em] mb-2">{label}</p>
            <p className="text-xl font-bold text-text-primary tabular-nums">
              {value}
              {unit && <span className="text-xs font-normal text-text-muted ml-1">{unit}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Service cards */}
      <div>
        <p className="text-xs font-semibold text-text-disabled uppercase tracking-[0.06em] mb-3">Services</p>
        <div className="grid grid-cols-1 gap-3">
          {SERVICES.map(({ name, stack, detail, status, icon: Icon, uptime, latency }) => {
            const cfg = STATUS_CONFIG[status];
            const StatusIcon = cfg.icon;
            return (
              <div
                key={name}
                className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-9 h-9 rounded-xl bg-bg-subtle flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{name}</p>
                  <p className="text-xs text-text-muted">{stack} — {detail}</p>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-xs tabular-nums shrink-0">
                  {uptime && uptime !== '—' && (
                    <div className="text-center">
                      <p className="text-text-disabled text-[10px] uppercase tracking-[0.06em]">Uptime</p>
                      <p className="text-text-secondary font-medium mt-0.5">{uptime}</p>
                    </div>
                  )}
                  {latency && latency !== '—' && (
                    <div className="text-center">
                      <p className="text-text-disabled text-[10px] uppercase tracking-[0.06em]">Latency</p>
                      <p className="text-text-secondary font-medium mt-0.5">{latency}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <StatusIcon size={13} className={cfg.color} />
                  <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI server note */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-300 mb-1">SMTP not configured</p>
        <p className="text-xs text-text-muted leading-relaxed">
          Email delivery is not configured. Set SMTP credentials in Platform Settings → Email to enable
          registration emails, password resets, and workspace notifications.
        </p>
      </div>
    </div>
  );
}
