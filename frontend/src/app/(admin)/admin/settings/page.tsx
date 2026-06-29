'use client';

import { Settings } from 'lucide-react';

const SETTING_GROUPS = [
  {
    title: 'Platform identity',
    settings: [
      { label: 'Platform name',    value: 'Leinaflow',             type: 'text'  },
      { label: 'Support email',    value: 'support@leinaflow.com', type: 'email' },
      { label: 'Primary domain',   value: 'leinaflow.com',         type: 'text'  },
    ],
  },
  {
    title: 'Authentication',
    settings: [
      { label: 'JWT expiry (seconds)',    value: '86400',  type: 'number' },
      { label: 'Allow self-registration', value: 'true',   type: 'toggle' },
      { label: 'Require email verify',    value: 'false',  type: 'toggle' },
    ],
  },
  {
    title: 'AI defaults',
    settings: [
      { label: 'Default temperature', value: '0.7',  type: 'number' },
      { label: 'Default max tokens',  value: '2048', type: 'number' },
    ],
  },
  {
    title: 'Limits',
    settings: [
      { label: 'Max workspaces per customer', value: '10',  type: 'number' },
      { label: 'Max creators per workspace',  value: '50',  type: 'number' },
      { label: 'Max employees per workspace', value: '100', type: 'number' },
    ],
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">System Settings</h1>
          <p className="text-sm text-text-muted mt-0.5">Platform-wide configuration — affects all workspaces</p>
        </div>
        <button
          type="button"
          disabled
          className="flex items-center gap-2 px-3.5 py-2 bg-violet-600/40 text-violet-300/60 text-sm font-medium rounded-lg cursor-not-allowed"
        >
          <Settings size={14} />
          Save changes
        </button>
      </div>

      <div className="space-y-4">
        {SETTING_GROUPS.map((group) => (
          <div key={group.title} className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
            <div className="border-b border-bg-border/40 px-4 py-3">
              <h2 className="text-sm font-semibold text-text-primary">{group.title}</h2>
            </div>
            <div className="divide-y divide-bg-border/40">
              {group.settings.map((setting) => (
                <div key={setting.label} className="flex items-center justify-between px-4 py-3.5">
                  <label className="text-sm text-text-secondary">{setting.label}</label>
                  {setting.type === 'toggle' ? (
                    <div className={[
                      'w-9 h-5 rounded-full flex items-center px-0.5 transition-colors cursor-not-allowed',
                      setting.value === 'true' ? 'bg-violet-600' : 'bg-bg-subtle border border-bg-border',
                    ].join(' ')}>
                      <div className={[
                        'w-4 h-4 rounded-full bg-white transition-transform',
                        setting.value === 'true' ? 'translate-x-4' : 'translate-x-0',
                      ].join(' ')} />
                    </div>
                  ) : (
                    <input
                      type={setting.type}
                      defaultValue={setting.value}
                      disabled
                      className="w-48 px-3 py-1.5 bg-bg-subtle border border-bg-border rounded-lg text-sm text-text-secondary text-right tabular-nums focus:outline-none cursor-not-allowed"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-text-disabled text-center">
        Settings API not yet implemented. Values shown are defaults for planning purposes.
      </p>
    </div>
  );
}
