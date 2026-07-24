'use client';

import { useEffect, useState } from 'react';
import { Users, Search, Shield, User, UserCheck, Users2, AlertCircle } from 'lucide-react';
import { Avatar, Badge, EmptyState, Skeleton } from '@/components/ui';
import { apiGet } from '@/lib/api';

interface UserSummary {
  id: string;
  email: string;
  username: string;
  name: string | null;
  role: 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'USER';
  isCreator: boolean;
  createdAt: string;
}

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
  const [users,   setUsers]   = useState<UserSummary[] | null>(null);
  const [error,   setError]   = useState('');
  const [query,   setQuery]   = useState('');

  useEffect(() => {
    apiGet<UserSummary[]>('/users')
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load users'));
  }, []);

  const filtered = (users ?? []).filter((u) =>
    u.email.toLowerCase().includes(query.toLowerCase()) ||
    u.username.toLowerCase().includes(query.toLowerCase()) ||
    (u.name ?? '').toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Users</h1>
          <p className="text-sm text-text-muted mt-0.5">
            All platform users across all workspaces{users ? ` — ${users.length} total` : ''}
          </p>
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
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users…"
          className="w-full pl-8 pr-4 py-2.5 bg-bg-surface border border-bg-border rounded-lg text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-violet-500/60 transition-colors"
        />
      </div>

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="border-b border-bg-border/40 px-4 py-3">
          <div className="grid grid-cols-4 text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em]">
            <span className="col-span-2">User</span>
            <span>Role</span>
            <span>Joined</span>
          </div>
        </div>

        {error ? (
          <EmptyState
            icon={AlertCircle}
            title="Couldn't load users"
            description={error}
            size="md"
          />
        ) : users === null ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={20} className="rounded" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={users.length === 0 ? 'No users yet' : 'No users match your search'}
            description={users.length === 0 ? 'Users appear here as soon as anyone registers.' : ''}
            size="md"
          />
        ) : (
          <div className="divide-y divide-bg-border/40">
            {filtered.map((u) => (
              <div key={u.id} className="grid grid-cols-4 items-center px-4 py-3">
                <div className="col-span-2 flex items-center gap-2.5">
                  <Avatar name={u.name || u.username} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{u.name || u.username}</p>
                    <p className="text-xs text-text-muted">{u.email}</p>
                  </div>
                </div>
                <div>
                  <Badge
                    variant={u.role === 'SUPER_ADMIN' ? 'danger' : u.role === 'OWNER' ? 'violet' : 'default'}
                    size="sm"
                  >
                    {u.role}
                  </Badge>
                </div>
                <span className="text-xs text-text-muted">
                  {new Date(u.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
