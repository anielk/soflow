'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Layers, Plus, Search } from 'lucide-react';
import { Badge, Button, EmptyState, Input, Modal, Skeleton, useToast } from '@/components/ui';
import { createWorkspace, listWorkspacesForAdmin, setWorkspaceActiveStatus } from '@/lib/workspace';
import type { AdminWorkspaceListItem } from '@/types/workspace';

export default function AdminWorkspacesPage() {
  const { showToast } = useToast();

  const [workspaces, setWorkspaces] = useState<AdminWorkspaceListItem[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // id of the workspace whose active/inactive toggle is in flight — disables just that row's button
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState('');

  function load() {
    setLoadError('');
    listWorkspacesForAdmin()
      .then(setWorkspaces)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load workspaces'));
  }

  useEffect(load, []);

  async function submitCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      await createWorkspace({ name: newName.trim() });
      setShowCreate(false);
      setNewName('');
      showToast('Workspace created', 'success');
      load();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create workspace');
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(workspace: AdminWorkspaceListItem) {
    setTogglingId(workspace.id);
    setToggleError('');
    try {
      const updated = await setWorkspaceActiveStatus(workspace.id, !workspace.isActive);
      setWorkspaces((prev) => prev?.map((w) => (w.id === updated.id ? updated : w)) ?? null);
      showToast(`Workspace ${updated.isActive ? 'activated' : 'deactivated'}`, 'success');
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : 'Failed to update workspace status');
    } finally {
      setTogglingId(null);
    }
  }

  const filtered = (workspaces ?? []).filter(
    (w) => w.name.toLowerCase().includes(query.toLowerCase()) || w.slug.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Workspaces</h1>
          <p className="text-sm text-text-muted mt-0.5">
            All tenant workspaces on the platform{workspaces ? ` — ${workspaces.length} total` : ''}
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => { setShowCreate(true); setCreateError(''); setNewName(''); }}>
          New workspace
        </Button>
      </div>

      {toggleError && (
        <div className="px-3 py-2.5 rounded bg-danger-subtle border border-danger/20 text-danger-text text-sm">
          {toggleError}
        </div>
      )}

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search workspaces…"
          className="w-full pl-8 pr-4 py-2.5 bg-bg-surface border border-bg-border rounded-lg text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-violet-500/60 transition-colors"
        />
      </div>

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="border-b border-bg-border/40 px-4 py-3">
          <div className="grid grid-cols-6 text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em]">
            <span className="col-span-2">Workspace</span>
            <span>Plan</span>
            <span>Members</span>
            <span>Status</span>
          </div>
        </div>

        {loadError ? (
          <EmptyState icon={AlertCircle} title="Couldn't load workspaces" description={loadError} size="md" />
        ) : workspaces === null ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={20} className="rounded" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Layers}
            title={workspaces.length === 0 ? 'No workspaces yet' : 'No workspaces match your search'}
            description={
              workspaces.length === 0
                ? 'Workspaces are the top-level unit of tenancy. Create one, or wait for the first registration.'
                : ''
            }
            size="md"
          />
        ) : (
          <div className="divide-y divide-bg-border/40">
            {filtered.map((w) => (
              <div key={w.id} className="grid grid-cols-6 items-center px-4 py-3">
                <div className="col-span-2">
                  <p className="text-sm font-medium text-text-primary">{w.name}</p>
                  <p className="text-xs text-text-muted">{w.slug}</p>
                </div>
                <div>
                  <Badge variant="default" size="sm">{w.plan[0].toUpperCase() + w.plan.slice(1)}</Badge>
                </div>
                <span className="text-sm text-text-secondary tabular-nums">{w.memberCount}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={w.isActive ? 'success' : 'default'} size="sm">
                    {w.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={togglingId === w.id}
                    onClick={() => toggleActive(w)}
                  >
                    {w.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-4">
        <p className="text-xs font-semibold text-text-disabled uppercase tracking-[0.06em] mb-2">Architecture note</p>
        <p className="text-xs text-text-muted leading-relaxed">
          Workspaces scope all entities: users, creator accounts, platform connections, and AI configurations.
          A user can be a member of multiple workspaces with different roles in each — creating a workspace here
          makes you its OWNER, same as registration does for a new account&apos;s first workspace.
        </p>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New workspace">
        <div className="space-y-4">
          <Input
            label="Workspace name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Acme Agency"
            autoFocus
          />
          {createError && <p className="text-xs text-danger-text">{createError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={creating} disabled={!newName.trim()} onClick={submitCreate}>
              Create workspace
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
