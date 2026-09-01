'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { isAuthenticated } from '@/lib/auth';
import { listMyWorkspaces, switchActiveWorkspace as switchActiveWorkspaceRequest } from '@/lib/workspace';
import type { WorkspaceMembershipSummary } from '@/types/workspace';

const CACHE_KEY = 'leinaflow_active_workspace_cache';

interface CachedWorkspace {
  id:   string;
  name: string;
  slug: string;
}

/**
 * UI-only optimization, never a source of truth: lets the sidebar show a
 * workspace name immediately on load instead of a blank/loading state,
 * while the real list is fetched from the backend. Always overwritten by
 * that fetch — nothing here is ever used to authorize a request or decide
 * which workspace's data to show.
 */
function readCache(): CachedWorkspace | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedWorkspace) : null;
  } catch {
    return null;
  }
}

function writeCache(workspace: CachedWorkspace | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (workspace) localStorage.setItem(CACHE_KEY, JSON.stringify(workspace));
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    // best-effort cache only — never block on storage failures
  }
}

interface WorkspaceContextValue {
  workspaces:      WorkspaceMembershipSummary[];
  activeWorkspace: WorkspaceMembershipSummary | null;
  /** Last-known active workspace name from localStorage, for an instant first paint while `loading`. Never used once the real list has loaded. */
  cachedName:      string | null;
  loading:         boolean;
  error:           string | null;
  switching:       boolean;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  refresh:         () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

/**
 * The one authoritative place the frontend tracks "which workspace is
 * active" — workspace-scoped pages/components should read this via
 * useWorkspace() rather than keeping their own copy. The backend
 * (User.activeWorkspaceId, resolved server-side on every request — see
 * WorkspaceService.resolveMembership) remains the real source of truth;
 * this only mirrors it for the UI.
 */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<WorkspaceMembershipSummary[]>([]);
  const [cachedName] = useState<string | null>(() => readCache()?.name ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const list = await listMyWorkspaces();
      setWorkspaces(list);
      const active = list.find((w) => w.isActive) ?? list[0] ?? null;
      writeCache(active ? { id: active.id, name: active.name, slug: active.slug } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    setSwitching(true);
    setError(null);
    try {
      await switchActiveWorkspaceRequest(workspaceId);
      // A full reload is deliberate, not a shortcut: a dozen-plus pages
      // (dashboard, creators, employees, settings, vault, queue, new-post,
      // ...) each fetch workspace-scoped data in their own mount-time
      // effect with no shared cache to invalidate. Reloading guarantees
      // every one of them re-fetches against the newly active workspace
      // instead of wiring a bespoke refetch trigger into each page.
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch workspace');
      setSwitching(false);
    }
  }, []);

  const activeWorkspace = workspaces.find((w) => w.isActive) ?? workspaces[0] ?? null;

  return (
    <WorkspaceContext.Provider
      value={{ workspaces, activeWorkspace, cachedName, loading, error, switching, switchWorkspace, refresh: load }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within a WorkspaceProvider');
  return ctx;
}
