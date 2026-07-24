'use client';

import { Plug, Clock } from 'lucide-react';
import { CloudivoPlannedNotice } from '@/components/admin/CloudivoPlannedNotice';

const CONNECTORS = [
  { name: 'OnlyFans',   category: 'Creator platform' },
  { name: 'Fansly',     category: 'Creator platform' },
  { name: 'Patreon',    category: 'Creator platform' },
  { name: 'Instagram',  category: 'Social'           },
  { name: 'TikTok',     category: 'Social'           },
  { name: 'X',          category: 'Social'           },
  { name: 'YouTube',    category: 'Streaming'        },
  { name: 'Twitch',     category: 'Streaming'        },
];

export default function AdminConnectorsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Connectors</h1>
        <p className="text-sm text-text-muted mt-0.5">Platform integrations available to workspaces</p>
      </div>

      <CloudivoPlannedNotice
        feature="Connectors"
        description="External platform integrations (OAuth, connected accounts) are shared Cloudivo platform functionality. None of the connectors below are actually connectable yet — this list is a reference of what's planned, not a live status."
      />

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="border-b border-bg-border/40 px-4 py-3">
          <div className="grid grid-cols-3 text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em]">
            <span className="col-span-2">Connector</span>
            <span>Category</span>
          </div>
        </div>
        <div className="divide-y divide-bg-border/40">
          {CONNECTORS.map((c) => (
            <div key={c.name} className="grid grid-cols-3 items-center px-4 py-3">
              <div className="col-span-2 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-bg-subtle flex items-center justify-center">
                  <Plug size={12} className="text-text-disabled" />
                </div>
                <span className="text-sm font-medium text-text-primary">{c.name}</span>
              </div>
              <span className="flex items-center gap-1 text-xs text-text-disabled">
                <Clock size={11} /> Planned
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
