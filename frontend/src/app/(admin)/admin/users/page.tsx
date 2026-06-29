'use client';

import { Users, Search, Shield, User, UserCheck, Users2 } from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#DC2626',
  OWNER:       '#8B5CF6',
  MANAGER:     '#3B82F6',
  USER:        '#6B7280',
};

const ROLES = [
  { role: 'SUPER_ADMIN', icon: Shield,    desc: 'Full platform access. Internal use only.'             },
  { role: 'OWNER',       icon: User,      desc: 'Full workspace access. Manages billing and members.'   },
  { role: 'MANAGER',     icon: UserCheck, desc: 'Can manage creators, employees, and growth settings.'  },
  { role: 'USER',        icon: Users2,    desc: 'Standard access. Configured by workspace owner.'       },
];

export default function AdminUsersPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Users</h1>
          <p className="text-sm text-text-muted mt-0.5">All platform users across all workspaces</p>
        </div>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ROLES.map(({ role, icon: Icon, desc }) => (
          <div key={role} className="bg-bg-surface border border-bg-border/60 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={13} style={{ color: ROLE_COLORS[role] }} />
              <span className="text-xs font-semibold" style={{ color: ROLE_COLORS[role] }}>{role}</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled" />
        <input
          type="text"
          placeholder="Search users…"
          className="w-full pl-8 pr-4 py-2.5 bg-bg-surface border border-bg-border rounded-lg text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-violet-500/60 transition-colors"
        />
      </div>

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <div className="border-b border-bg-border/40 px-4 py-3">
          <div className="grid grid-cols-4 text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em]">
            <span className="col-span-2">User</span>
            <span>Role</span>
            <span>Joined</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Users size={32} className="text-text-disabled" strokeWidth={1.2} />
          <p className="text-sm font-medium text-text-secondary">No users loaded</p>
          <p className="text-xs text-text-muted">Connect to the users API to list all platform users.</p>
        </div>
      </div>
    </div>
  );
}
