'use client';

import { ShieldAlert, Building2, Users, Layers, Bot, Plug, TrendingUp, AlertCircle } from 'lucide-react';

const STAT_CARDS = [
  { label: 'Workspaces',       value: '0', icon: Layers,    color: '#8B5CF6', sub: 'Total registered'    },
  { label: 'Users',            value: '0', icon: Users,     color: '#3B82F6', sub: 'Across all workspaces' },
  { label: 'Customers',        value: '0', icon: Building2, color: '#10B981', sub: 'Paying accounts'      },
  { label: 'AI providers',     value: '0', icon: Bot,       color: '#F59E0B', sub: 'Configured'           },
  { label: 'Connectors',       value: '0', icon: Plug,      color: '#EC4899', sub: 'Active integrations'  },
  { label: 'MRR',              value: '$0', icon: TrendingUp,color: '#06B6D4', sub: 'Monthly recurring'   },
];

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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-bg-surface border border-bg-border/60 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="text-xs font-semibold text-text-disabled uppercase tracking-[0.06em]">{label}</p>
            </div>
            <p className="text-2xl font-bold text-text-primary tabular-nums">{value}</p>
            <p className="text-xs text-text-muted mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Architecture note */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Platform architecture</h2>
        <div className="flex items-center gap-2 flex-wrap text-xs text-text-muted">
          {['Platform', '→', 'Workspaces', '→', 'Users / Creators', '→', 'Connected platforms', '→', 'AI connections'].map((item, i) => (
            <span
              key={i}
              className={item === '→' ? 'text-text-disabled' : 'px-2 py-1 bg-bg-subtle rounded-md text-text-secondary font-medium'}
            >
              {item}
            </span>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-3 leading-relaxed">
          Each workspace is an independent tenant. Users, creators, platform connectors, and AI configurations
          are scoped to a workspace. The platform layer (this admin area) sits above all workspaces.
        </p>
      </div>
    </div>
  );
}
