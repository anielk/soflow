'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Avatar, Badge, Button, EmptyState } from '@/components/ui';
import { UserPlus, Search, ChevronUp, ChevronDown, Users, Loader2 } from 'lucide-react';
import { listMembers } from '@/lib/workspace';
import type { WorkspaceMemberRecord } from '@/types/workspace';

type SortField  = 'name' | 'role' | 'joinedAt';
type SortDir    = 'asc' | 'desc';
type RoleFilter = 'all' | string;

const ROLE_BADGE: Record<string, { label: string; variant: 'violet' | 'default' }> = {
  SUPER_ADMIN: { label: 'Super admin', variant: 'violet' },
  OWNER:       { label: 'Owner',       variant: 'violet' },
  MANAGER:     { label: 'Manager',     variant: 'default' },
  USER:        { label: 'Member',      variant: 'default' },
};

export default function EmployeesPage() {
  const router = useRouter();
  const [members,    setMembers]    = useState<WorkspaceMemberRecord[] | null>(null);
  const [loadError,  setLoadError]  = useState('');
  const [query,      setQuery]      = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [sortField,  setSortField]  = useState<SortField>('joinedAt');
  const [sortDir,    setSortDir]    = useState<SortDir>('asc');

  const load = useCallback(() => {
    setLoadError('');
    listMembers()
      .then(setMembers)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load team members'));
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
    else load();
  }, [router, load]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp size={12} className="text-text-disabled/40" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-violet-400" />
      : <ChevronDown size={12} className="text-violet-400" />;
  }

  const roles = Array.from(new Set((members ?? []).map((m) => m.role)));

  const rows = [...(members ?? [])]
    .filter((m) => roleFilter === 'all' || m.role === roleFilter)
    .filter((m) => {
      const name = m.user.name ?? '';
      return name.toLowerCase().includes(query.toLowerCase()) || m.user.email.toLowerCase().includes(query.toLowerCase());
    })
    .sort((a, b) => {
      const av = sortField === 'name' ? (a.user.name ?? a.user.email) : sortField === 'role' ? a.role : a.joinedAt;
      const bv = sortField === 'name' ? (b.user.name ?? b.user.email) : sortField === 'role' ? b.role : b.joinedAt;
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Team</h1>
          <p className="mt-1 text-sm text-text-muted">
            {members ? `${members.length} member${members.length === 1 ? '' : 's'} in this workspace` : 'Loading…'}
          </p>
        </div>
        <Button variant="primary" size="md" icon={UserPlus} onClick={() => router.push('/settings')}>
          Invite team member
        </Button>
      </div>

      <p className="text-xs text-text-muted -mt-3">
        This list is real — the same team membership used by Settings → Users. Performance tracking (messages,
        revenue, response time) and shift scheduling are not implemented yet.
      </p>

      {/* Table */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-bg-border/40 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={[
                'px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors duration-150',
                roleFilter === 'all'
                  ? 'bg-violet-600/15 text-violet-400'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-subtle',
              ].join(' ')}
            >
              All roles
            </button>
            {roles.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={[
                  'px-2.5 py-1 rounded text-xs font-medium transition-colors duration-150',
                  roleFilter === r
                    ? 'bg-violet-600/15 text-violet-400'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-subtle',
                ].join(' ')}
              >
                {ROLE_BADGE[r]?.label ?? r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 h-8 bg-bg-subtle border border-bg-border/60 rounded-lg flex-1 min-w-[160px] max-w-sm ml-auto">
            <Search size={13} className="text-text-muted shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search team members…"
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
            />
          </div>
        </div>

        {loadError ? (
          <EmptyState icon={Users} title="Couldn't load team members" description={loadError} size="md" />
        ) : !members ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-text-muted" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border/40">
                  {[
                    { field: 'name' as const,     label: 'Member' },
                    { field: 'role' as const,     label: 'Role' },
                    { field: 'joinedAt' as const, label: 'Joined' },
                  ].map(({ field, label }) => (
                    <th
                      key={field}
                      onClick={() => toggleSort(field)}
                      className="text-left text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5 cursor-pointer hover:text-text-secondary transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        {label}
                        <SortIcon field={field} />
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-2.5 w-20" />
                </tr>
              </thead>

              <tbody className="divide-y divide-bg-border/40">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-sm text-text-muted">
                      No team members match your filters
                    </td>
                  </tr>
                )}
                {rows.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-bg-subtle/40 transition-colors duration-100 cursor-pointer"
                    onClick={() => router.push(`/employees/${m.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={m.user.name ?? m.user.email} size="sm" />
                        <div>
                          <p className="font-semibold text-text-primary">{m.user.name ?? m.user.email}</p>
                          <p className="text-xs text-text-muted">{m.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ROLE_BADGE[m.role]?.variant ?? 'default'} size="sm">
                        {ROLE_BADGE[m.role]?.label ?? m.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {new Date(m.joinedAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-xs text-text-muted hover:text-violet-400 transition-colors"
                        onClick={(e) => { e.stopPropagation(); router.push(`/employees/${m.id}`); }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
