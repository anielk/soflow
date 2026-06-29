'use client';

import { ScrollText, RefreshCw } from 'lucide-react';
import { useState } from 'react';

type LogLevel = 'all' | 'info' | 'warn' | 'error';

export default function AdminLogsPage() {
  const [level, setLevel] = useState<LogLevel>('all');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Logs</h1>
          <p className="text-sm text-text-muted mt-0.5">Platform-wide system log stream</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-2 bg-bg-surface border border-bg-border rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Level filter */}
      <div className="flex items-center gap-2">
        {(['all', 'info', 'warn', 'error'] as LogLevel[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLevel(l)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
              level === l
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                : 'bg-bg-surface border border-bg-border text-text-muted hover:text-text-secondary',
            ].join(' ')}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Log viewer */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="border-b border-bg-border/40 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Log stream</h2>
          <span className="text-xs text-text-disabled">Live feed — not yet connected</span>
        </div>
        <div className="bg-[#09090B] font-mono text-xs p-4 min-h-[320px] flex flex-col items-center justify-center gap-3">
          <ScrollText size={28} className="text-text-disabled" strokeWidth={1.2} />
          <p className="text-text-disabled">No log entries</p>
          <p className="text-text-disabled/60 text-[11px]">Connect to the logging service to stream entries here.</p>
        </div>
      </div>
    </div>
  );
}
