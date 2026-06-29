'use client';

import { Plus } from 'lucide-react';

const EXAMPLE_FLAGS = [
  { key: 'ai_copilot',          name: 'AI Copilot',          enabled: false, rollout: 0,   desc: 'Message suggestion AI'           },
  { key: 'multi_workspace',     name: 'Multi-workspace',     enabled: false, rollout: 0,   desc: 'Allow users to join >1 workspace' },
  { key: 's4s_collaborations',  name: 'S4S Collaborations',  enabled: true,  rollout: 100, desc: 'Share-for-share feature set'      },
  { key: 'ai_post_optimizer',   name: 'AI Post Optimizer',   enabled: false, rollout: 0,   desc: 'Best-time scheduling AI'         },
  { key: 'connected_platforms', name: 'Connected Platforms', enabled: true,  rollout: 100, desc: 'Multi-platform connector UI'      },
];

export default function AdminFeatureFlagsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Feature Flags</h1>
          <p className="text-sm text-text-muted mt-0.5">Control feature availability per workspace or globally</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={14} />
          New flag
        </button>
      </div>

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="border-b border-bg-border/40 px-4 py-3">
          <div className="grid grid-cols-5 text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em]">
            <span className="col-span-2">Flag</span>
            <span>Status</span>
            <span>Rollout</span>
            <span>Scope</span>
          </div>
        </div>
        <div className="divide-y divide-bg-border/40">
          {EXAMPLE_FLAGS.map((flag) => (
            <div key={flag.key} className="grid grid-cols-5 items-center px-4 py-3.5 hover:bg-bg-subtle/30 transition-colors">
              <div className="col-span-2">
                <p className="text-sm font-medium text-text-primary">{flag.name}</p>
                <code className="text-[10px] text-text-disabled">{flag.key}</code>
                <p className="text-xs text-text-muted mt-0.5">{flag.desc}</p>
              </div>
              <div>
                <span className={[
                  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                  flag.enabled
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-bg-subtle text-text-disabled',
                ].join(' ')}>
                  <span className={['w-1.5 h-1.5 rounded-full', flag.enabled ? 'bg-emerald-400' : 'bg-text-disabled'].join(' ')} />
                  {flag.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="text-sm text-text-secondary tabular-nums">{flag.rollout}%</div>
              <div className="text-xs text-text-muted">Global</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-4">
        <p className="text-xs font-semibold text-text-disabled uppercase tracking-[0.06em] mb-2">Architecture note</p>
        <p className="text-xs text-text-muted leading-relaxed">
          Feature flags can be global (all workspaces) or targeted to specific workspace IDs.
          Rollout percentage controls gradual releases. The FeatureFlag model is defined in the admin types.
          API implementation is pending — these are example flags for planning purposes.
        </p>
      </div>
    </div>
  );
}
