'use client';

import { Layers, Plus, Search } from 'lucide-react';

export default function AdminWorkspacesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Workspaces</h1>
          <p className="text-sm text-text-muted mt-0.5">All tenant workspaces on the platform</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={14} />
          New workspace
        </button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled" />
        <input
          type="text"
          placeholder="Search workspaces…"
          className="w-full pl-8 pr-4 py-2.5 bg-bg-surface border border-bg-border rounded-lg text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-violet-500/60 transition-colors"
        />
      </div>

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <div className="border-b border-bg-border/40 px-4 py-3">
          <div className="grid grid-cols-5 text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em]">
            <span className="col-span-2">Workspace</span>
            <span>Plan</span>
            <span>Members</span>
            <span>Status</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Layers size={32} className="text-text-disabled" strokeWidth={1.2} />
          <p className="text-sm font-medium text-text-secondary">No workspaces yet</p>
          <p className="text-xs text-text-muted">
            Workspaces are the top-level unit of tenancy. Each customer gets one or more workspaces.
          </p>
        </div>
      </div>

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-4">
        <p className="text-xs font-semibold text-text-disabled uppercase tracking-[0.06em] mb-2">Architecture note</p>
        <p className="text-xs text-text-muted leading-relaxed">
          Workspaces scope all entities: users, creator accounts, platform connections, and AI configurations.
          A user can be a member of multiple workspaces with different roles in each.
          Nothing in the platform assumes a single workspace exists.
        </p>
      </div>
    </div>
  );
}
