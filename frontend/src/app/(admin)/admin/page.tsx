'use client';

import {
  ShieldAlert, Building2, Users, Layers, Plug, TrendingUp,
  CreditCard, Bot, HardDrive, AlertCircle,
  UserPlus, Activity as ActivityIcon, Inbox,
} from 'lucide-react';
import { EmptyState } from '@/components/ui';

// "—" is a deliberate placeholder, not a fabricated zero: none of these are
// wired to a real query. Several (Customers, AI Requests, Storage Used,
// Revenue, Active Subscriptions, Connected Platforms) are Cloudivo platform
// concerns and won't be built here at all — see docs/deployment/
// Architecture.md's multi-product notes. Active Workspaces/Active Users are
// real Leinaflow concepts but a real platform-wide count isn't built yet
// either (out of scope for the Beta stabilization sprint).
const STAT_CARDS = [
  { label: 'Total Customers',       icon: Building2,   color: '#10B981', sub: 'Cloudivo — planned'        },
  { label: 'Active Workspaces',     icon: Layers,      color: '#8B5CF6', sub: 'Not implemented yet'        },
  { label: 'Active Users',          icon: Users,       color: '#3B82F6', sub: 'Not implemented yet'        },
  { label: 'Connected Platforms',   icon: Plug,        color: '#EC4899', sub: 'Cloudivo — planned'        },
  { label: 'AI Requests Today',     icon: Bot,         color: '#F59E0B', sub: 'Cloudivo — planned'        },
  { label: 'Storage Used',          icon: HardDrive,   color: '#06B6D4', sub: 'Cloudivo — planned'        },
  { label: 'Revenue (MRR)',         icon: TrendingUp,  color: '#10B981', sub: 'Cloudivo — planned'        },
  { label: 'Active Subscriptions',  icon: CreditCard,  color: '#6366F1', sub: 'Cloudivo — planned'        },
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

      {/* Stat cards — every value is an honest placeholder, not a computed metric */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, icon: Icon, color, sub }) => (
          <div key={label} className="bg-bg-surface border border-bg-border/60 rounded-xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                <Icon size={14} style={{ color }} />
              </div>
              <p className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] leading-tight">{label}</p>
            </div>
            <p className="text-2xl font-bold text-text-disabled tabular-nums">—</p>
            <p className="text-xs text-text-muted mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/*
        This dashboard previously showed fabricated company names, fake
        system-event messages, a fake "all healthy" status board that
        contradicted the real health check, and fake queue counts. None of
        it was ever connected to anything — it's been replaced with honest
        empty states rather than left in place.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
          <div className="border-b border-bg-border/40 px-4 py-3 flex items-center gap-2">
            <UserPlus size={13} className="text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">Recent registrations</h2>
          </div>
          <EmptyState
            icon={UserPlus}
            size="sm"
            title="Not implemented yet"
            description="A platform-wide feed of new workspace registrations isn't built."
          />
        </div>

        <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
          <div className="border-b border-bg-border/40 px-4 py-3 flex items-center gap-2">
            <ActivityIcon size={13} className="text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">System events</h2>
          </div>
          <EmptyState
            icon={ActivityIcon}
            size="sm"
            title="Not implemented yet"
            description="Real audit and activity events exist — see System → Audit / Activity for the live, DB-backed view."
            action={{ label: 'Go to System', href: '/admin/system' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
          <div className="border-b border-bg-border/40 px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Server health</h2>
          </div>
          <EmptyState
            icon={AlertCircle}
            size="sm"
            title="See System → Health for real status"
            description="This card previously showed a fixed 'all healthy' status that never reflected reality. The real, live check (database, Redis, storage, SMTP) lives under System."
            action={{ label: 'Go to System → Health', href: '/admin/system' }}
          />
        </div>

        <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
          <div className="border-b border-bg-border/40 px-4 py-3 flex items-center gap-2">
            <Inbox size={13} className="text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">Queue status</h2>
          </div>
          <EmptyState
            icon={Inbox}
            size="sm"
            title="Not implemented yet"
            description="There is no background job queue in Leinaflow today — nothing to report here."
          />
        </div>
      </div>
    </div>
  );
}
