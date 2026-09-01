'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { LogoIcon } from '@/components/brand/Logo';
import { useWorkspace } from './WorkspaceContext';

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

/**
 * The sidebar's workspace header, wired to WorkspaceContext. Replaces the
 * old static "Leinaflow" label + inert chevron with a real switcher: shows
 * the active workspace, opens a dropdown of every workspace the caller
 * belongs to, and switches on click. Same hand-rolled dropdown pattern as
 * UserMenu.tsx (ref + outside-click/Escape listeners) — there is no shared
 * Dropdown primitive in this codebase yet to reuse instead.
 */
export function WorkspaceSwitcher({ collapsed = false }: WorkspaceSwitcherProps) {
  const { workspaces, activeWorkspace, cachedName, loading, error, switching, switchWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
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
    </div>
  ) : null;

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
    </div>
  );
}
