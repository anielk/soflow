'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Plus } from 'lucide-react';
import { Avatar, Button, Input, Modal } from '@/components/ui';
import { LogoIcon } from '@/components/brand/Logo';
import { createWorkspace as createWorkspaceRequest } from '@/lib/workspace';
import { useWorkspace } from './WorkspaceContext';

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

/**
 * The sidebar's workspace header, wired to WorkspaceContext. Replaces the
 * old static "Leinaflow" label + inert chevron with a real switcher: shows
 * the active workspace, opens a dropdown of every workspace the caller
 * belongs to, switches on click, and lets the caller create a new one
 * (any authenticated user may — see WorkspaceService.create's own comment;
 * this was previously only reachable via the SUPER_ADMIN admin panel). Same
 * hand-rolled dropdown pattern as UserMenu.tsx (ref + outside-click/Escape
 * listeners) — there is no shared Dropdown primitive in this codebase yet
 * to reuse instead.
 */
export function WorkspaceSwitcher({ collapsed = false }: WorkspaceSwitcherProps) {
  const { workspaces, activeWorkspace, cachedName, loading, error, switching, switchWorkspace, refresh } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  async function handleSelect(workspaceId: string) {
    if (workspaceId === activeWorkspace?.id || switching) return;
    await switchWorkspace(workspaceId);
    // No setOpen(false) on success — switchWorkspace() reloads the page.
    // On failure the dropdown stays open so the error message is visible.
  }

  // Closes the switcher dropdown before opening the modal — Modal's own
  // full-screen backdrop makes leaving the dropdown open underneath it
  // pointless, same reasoning as closing any menu before a dialog opens.
  function handleOpenCreate() {
    setOpen(false);
    setNewName('');
    setCreateError(null);
    setShowCreate(true);
  }

  async function submitCreate() {
    const trimmed = newName.trim();
    if (!trimmed || creating) return; // empty name and double-submit guard
    setCreating(true);
    setCreateError(null);
    try {
      await createWorkspaceRequest({ name: trimmed });
      // Backend already made the new workspace active — refresh the shared
      // context so the switcher (and its active checkmark) picks that up.
      await refresh();
      setShowCreate(false);
      setNewName('');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create workspace');
      // Modal stays open on failure so the error message is visible.
    } finally {
      setCreating(false);
    }
  }

  const displayName = activeWorkspace?.name ?? (loading ? cachedName : null) ?? 'Workspace';

  const dropdown = open ? (
    <div
      className={[
        'absolute w-64 bg-bg-overlay border border-bg-border rounded-xl shadow-xl py-1.5 z-50',
        collapsed ? 'left-full top-0 ml-2' : 'top-full left-0 mt-2',
      ].join(' ')}
    >
      <div className="px-3 py-2 border-b border-bg-border/60 mb-1">
        <p className="text-xs font-semibold text-text-primary">Your workspaces</p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 px-3 py-3 text-xs text-text-muted">
          <Loader2 size={13} className="animate-spin" />
          Loading workspaces…
        </div>
      )}

      {!loading && error && (
        <p className="px-3 py-3 text-xs text-danger-text">{error}</p>
      )}

      {!loading && !error && workspaces.length === 0 && (
        <p className="px-3 py-3 text-xs text-text-muted">No workspaces found.</p>
      )}

      {!loading && !error && workspaces.map((workspace) => (
        <button
          key={workspace.id}
          type="button"
          disabled={switching}
          onClick={() => handleSelect(workspace.id)}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Avatar name={workspace.name} size="xs" />
          <span className="flex-1 min-w-0">
            <span className="block truncate text-text-primary">{workspace.name}</span>
            <span className="block truncate text-[10px] text-text-disabled capitalize">{workspace.role.toLowerCase()}</span>
          </span>
          {workspace.id === activeWorkspace?.id ? (
            <Check size={13} className="text-violet-400 shrink-0" />
          ) : switching ? (
            <Loader2 size={13} className="animate-spin text-text-disabled shrink-0" />
          ) : null}
        </button>
      ))}

      {!loading && (
        <>
          <div className="my-1 border-t border-bg-border/60" />
          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors"
          >
            <Plus size={13} className="text-text-disabled shrink-0" />
            <span>Create workspace</span>
          </button>
        </>
      )}
    </div>
  ) : null;

  const createModal = (
    <Modal
      open={showCreate}
      onClose={() => { if (!creating) setShowCreate(false); }}
      title="Create workspace"
    >
      <div className="space-y-4">
        <Input
          label="Workspace name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g. Acme Agency"
          autoFocus
          disabled={creating}
        />
        {createError && <p className="text-xs text-danger-text">{createError}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)} disabled={creating}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" loading={creating} disabled={creating || !newName.trim()} onClick={submitCreate}>
            Create workspace
          </Button>
        </div>
      </div>
    </Modal>
  );

  if (collapsed) {
    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
          aria-label="Switch workspace"
          aria-expanded={open}
        >
          <LogoIcon size={28} />
        </button>
        {dropdown}
        {createModal}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative flex items-center gap-3 min-w-0 flex-1">
      <LogoIcon size={28} />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex-1 min-w-0 flex items-center gap-1.5 text-left focus-visible:outline-none"
        aria-label="Switch workspace"
        aria-expanded={open}
      >
        <span className="text-[15px] font-bold text-text-primary tracking-tight truncate">{displayName}</span>
        <ChevronDown
          size={13}
          className={['ml-auto shrink-0 text-text-disabled transition-transform duration-150', open ? 'rotate-180' : ''].join(' ')}
        />
      </button>
      {dropdown}
      {createModal}
    </div>
  );
}
