'use client';

import { Plug, CheckCircle2, Clock } from 'lucide-react';

const CONNECTORS = [
  { name: 'OnlyFans',   status: 'available',    category: 'Creator platform' },
  { name: 'Fansly',     status: 'coming_soon',  category: 'Creator platform' },
  { name: 'Patreon',    status: 'coming_soon',  category: 'Creator platform' },
  { name: 'Instagram',  status: 'coming_soon',  category: 'Social'           },
  { name: 'TikTok',     status: 'coming_soon',  category: 'Social'           },
  { name: 'X',          status: 'coming_soon',  category: 'Social'           },
  { name: 'YouTube',    status: 'coming_soon',  category: 'Streaming'        },
  { name: 'Twitch',     status: 'coming_soon',  category: 'Streaming'        },
];

export default function AdminConnectorsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Connectors</h1>
        <p className="text-sm text-text-muted mt-0.5">Platform integrations available to workspaces</p>
      </div>

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="border-b border-bg-border/40 px-4 py-3">
          <div className="grid grid-cols-4 text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em]">
            <span className="col-span-2">Connector</span>
            <span>Category</span>
            <span>Status</span>
          </div>
        </div>
        <div className="divide-y divide-bg-border/40">
          {CONNECTORS.map((c) => (
            <div key={c.name} className="grid grid-cols-4 items-center px-4 py-3">
              <div className="col-span-2 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-bg-subtle flex items-center justify-center">
                  <Plug size={12} className="text-text-disabled" />
                </div>
                <span className="text-sm font-medium text-text-primary">{c.name}</span>
              </div>
              <span className="text-xs text-text-muted">{c.category}</span>
              <div>
                {c.status === 'available' ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle2 size={11} /> Available
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-text-disabled">
                    <Clock size={11} /> Coming soon
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-4">
        <p className="text-xs font-semibold text-text-disabled uppercase tracking-[0.06em] mb-2">Architecture</p>
        <p className="text-xs text-text-muted leading-relaxed">
          Each connector is an independent integration module. Adding a new connector does not change
          how existing connectors work. Workspaces choose which connectors to enable.
          OnlyFans is the first available connector; additional connectors will be added progressively.
        </p>
      </div>
    </div>
  );
}
