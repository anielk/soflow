'use client';

import { Server, Database, Radio, HardDrive, CheckCircle2, AlertCircle } from 'lucide-react';

const SERVICES = [
  { name: 'Frontend',      service: 'Next.js 15',    status: 'healthy', icon: Server,   detail: 'App Router, dark UI' },
  { name: 'Backend API',   service: 'NestJS',         status: 'healthy', icon: Server,   detail: 'REST + WebSocket'    },
  { name: 'Database',      service: 'PostgreSQL 16',  status: 'healthy', icon: Database, detail: 'Prisma ORM'          },
  { name: 'Cache',         service: 'Redis',          status: 'healthy', icon: HardDrive,detail: 'Session + queue'     },
  { name: 'WebSocket',     service: 'Socket.IO',      status: 'healthy', icon: Radio,    detail: 'Real-time events'    },
];

export default function AdminInfrastructurePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Infrastructure</h1>
        <p className="text-sm text-text-muted mt-0.5">Platform service health and system status</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {SERVICES.map(({ name, service, status, icon: Icon, detail }) => (
          <div key={name} className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-bg-subtle flex items-center justify-center shrink-0">
              <Icon size={16} className="text-text-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">{name}</p>
              <p className="text-xs text-text-muted">{service} — {detail}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {status === 'healthy' ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">Healthy</span>
                </>
              ) : (
                <>
                  <AlertCircle size={13} className="text-red-400" />
                  <span className="text-xs text-red-400 font-medium">Degraded</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Uptime',    value: '—',  unit: ''   },
          { label: 'Requests',  value: '—',  unit: '/hr' },
          { label: 'Latency',   value: '—',  unit: 'ms' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 text-center">
            <p className="text-[11px] text-text-disabled uppercase tracking-[0.06em] mb-2">{label}</p>
            <p className="text-2xl font-bold text-text-primary tabular-nums">
              {value}<span className="text-sm font-normal text-text-muted ml-1">{unit}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
