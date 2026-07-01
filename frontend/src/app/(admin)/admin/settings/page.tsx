'use client';

import { useState } from 'react';
import {
  Settings, Palette, Shield, Mail, HardDrive, Bot,
  Key, ToggleLeft, Link2, Save,
} from 'lucide-react';

type Tab =
  | 'general' | 'branding' | 'security' | 'email'
  | 'storage' | 'ai' | 'api' | 'feature-flags' | 'integrations';

const TABS: { id: Tab; label: string; icon: typeof Settings }[] = [
  { id: 'general',       label: 'General',       icon: Settings    },
  { id: 'branding',      label: 'Branding',       icon: Palette     },
  { id: 'security',      label: 'Security',       icon: Shield      },
  { id: 'email',         label: 'Email',          icon: Mail        },
  { id: 'storage',       label: 'Storage',        icon: HardDrive   },
  { id: 'ai',            label: 'AI',             icon: Bot         },
  { id: 'api',           label: 'API',            icon: Key         },
  { id: 'feature-flags', label: 'Feature Flags',  icon: ToggleLeft  },
  { id: 'integrations',  label: 'Integrations',   icon: Link2       },
];

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <label className="text-sm text-text-secondary">{label}</label>
      <div className="ml-4">{children}</div>
    </div>
  );
}

function TextInput({ value, type = 'text' }: { value: string; type?: string }) {
  return (
    <input
      type={type}
      defaultValue={value}
      disabled
      className="w-48 px-3 py-1.5 bg-bg-subtle border border-bg-border rounded-lg text-sm text-text-secondary text-right tabular-nums focus:outline-none cursor-not-allowed"
    />
  );
}

function Toggle({ value }: { value: boolean }) {
  return (
    <div className={[
      'w-9 h-5 rounded-full flex items-center px-0.5 transition-colors cursor-not-allowed',
      value ? 'bg-violet-600' : 'bg-bg-subtle border border-bg-border',
    ].join(' ')}>
      <div className={['w-4 h-4 rounded-full bg-white transition-transform', value ? 'translate-x-4' : 'translate-x-0'].join(' ')} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
      <div className="border-b border-bg-border/40 px-4 py-3">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      <div className="divide-y divide-bg-border/40">{children}</div>
    </div>
  );
}

function GeneralTab() {
  return (
    <div className="space-y-4">
      <Section title="Platform identity">
        <FieldRow label="Platform name"><TextInput value="Leinaflow" /></FieldRow>
        <FieldRow label="Support email"><TextInput value="support@leinaflow.com" type="email" /></FieldRow>
        <FieldRow label="Primary domain"><TextInput value="leinaflow.com" /></FieldRow>
        <FieldRow label="Company name"><TextInput value="Cloudivo" /></FieldRow>
      </Section>
      <Section title="Localisation">
        <FieldRow label="Timezone"><TextInput value="UTC" /></FieldRow>
        <FieldRow label="Default language"><TextInput value="en" /></FieldRow>
        <FieldRow label="Date format"><TextInput value="DD/MM/YYYY" /></FieldRow>
      </Section>
      <Section title="Platform limits">
        <FieldRow label="Max workspaces per customer"><TextInput value="10" type="number" /></FieldRow>
        <FieldRow label="Max creators per workspace"><TextInput value="50" type="number" /></FieldRow>
        <FieldRow label="Max employees per workspace"><TextInput value="100" type="number" /></FieldRow>
      </Section>
    </div>
  );
}

function BrandingTab() {
  return (
    <div className="space-y-4">
      <Section title="Identity">
        <FieldRow label="Platform name"><TextInput value="Leinaflow" /></FieldRow>
        <FieldRow label="Tagline"><TextInput value="Creator management for agencies" /></FieldRow>
        <FieldRow label="Footer text"><TextInput value="A product of Cloudivo" /></FieldRow>
      </Section>
      <Section title="Colours">
        <FieldRow label="Primary accent">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-violet-600 border border-bg-border" />
            <TextInput value="#7C3AED" />
          </div>
        </FieldRow>
        <FieldRow label="Admin accent">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-red-600 border border-bg-border" />
            <TextInput value="#DC2626" />
          </div>
        </FieldRow>
      </Section>
      <Section title="Assets">
        <div className="px-4 py-6 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-bg-subtle border border-bg-border flex items-center justify-center">
            <Palette size={22} className="text-text-disabled" strokeWidth={1.3} />
          </div>
          <p className="text-xs text-text-muted">Logo upload — not yet implemented</p>
        </div>
      </Section>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-4">
      <Section title="Authentication">
        <FieldRow label="JWT expiry (seconds)"><TextInput value="86400" type="number" /></FieldRow>
        <FieldRow label="Allow self-registration"><Toggle value={true} /></FieldRow>
        <FieldRow label="Require email verification"><Toggle value={false} /></FieldRow>
        <FieldRow label="Allow password reset"><Toggle value={true} /></FieldRow>
      </Section>
      <Section title="Two-factor authentication">
        <FieldRow label="Require 2FA for SUPER_ADMIN"><Toggle value={false} /></FieldRow>
        <FieldRow label="Allow 2FA for all users"><Toggle value={false} /></FieldRow>
      </Section>
      <Section title="Sessions">
        <FieldRow label="Max sessions per user"><TextInput value="5" type="number" /></FieldRow>
        <FieldRow label="Session timeout (hours)"><TextInput value="24" type="number" /></FieldRow>
      </Section>
    </div>
  );
}

function EmailTab() {
  return (
    <div className="space-y-4">
      <Section title="SMTP configuration">
        <FieldRow label="SMTP host"><TextInput value="Not configured" /></FieldRow>
        <FieldRow label="SMTP port"><TextInput value="587" type="number" /></FieldRow>
        <FieldRow label="SMTP username"><TextInput value="" /></FieldRow>
        <FieldRow label="Use TLS"><Toggle value={true} /></FieldRow>
      </Section>
      <Section title="Sender identity">
        <FieldRow label="From name"><TextInput value="Leinaflow" /></FieldRow>
        <FieldRow label="From address"><TextInput value="noreply@leinaflow.com" type="email" /></FieldRow>
        <FieldRow label="Reply-to"><TextInput value="support@leinaflow.com" type="email" /></FieldRow>
      </Section>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-300 mb-1">SMTP not configured</p>
        <p className="text-xs text-text-muted leading-relaxed">
          Email delivery is disabled. Registration confirmations, password resets, and workspace
          notifications will not be sent until SMTP is configured.
        </p>
      </div>
    </div>
  );
}

function StorageTab() {
  return (
    <div className="space-y-4">
      <Section title="Storage provider">
        <FieldRow label="Provider">
          <select disabled className="px-3 py-1.5 bg-bg-subtle border border-bg-border rounded-lg text-sm text-text-secondary focus:outline-none cursor-not-allowed">
            <option>Local filesystem</option>
            <option>AWS S3</option>
            <option>Cloudflare R2</option>
          </select>
        </FieldRow>
        <FieldRow label="Base path / bucket"><TextInput value="/storage" /></FieldRow>
        <FieldRow label="Public base URL"><TextInput value="http://localhost:4000/uploads" /></FieldRow>
      </Section>
      <Section title="Limits">
        <FieldRow label="Max file size (MB)"><TextInput value="50" type="number" /></FieldRow>
        <FieldRow label="Max storage per workspace (GB)"><TextInput value="10" type="number" /></FieldRow>
        <FieldRow label="Allowed MIME types"><TextInput value="image/*, video/*" /></FieldRow>
      </Section>
    </div>
  );
}

function AISettingsTab() {
  return (
    <div className="space-y-4">
      <Section title="Global defaults">
        <FieldRow label="Default provider">
          <select disabled className="px-3 py-1.5 bg-bg-subtle border border-bg-border rounded-lg text-sm text-text-disabled focus:outline-none cursor-not-allowed">
            <option>No provider configured</option>
          </select>
        </FieldRow>
        <FieldRow label="Default model">
          <select disabled className="px-3 py-1.5 bg-bg-subtle border border-bg-border rounded-lg text-sm text-text-disabled focus:outline-none cursor-not-allowed">
            <option>No model selected</option>
          </select>
        </FieldRow>
        <FieldRow label="Default temperature"><TextInput value="0.7" type="number" /></FieldRow>
        <FieldRow label="Default max tokens"><TextInput value="2048" type="number" /></FieldRow>
      </Section>
      <Section title="Behaviour">
        <FieldRow label="Allow workspace overrides"><Toggle value={true} /></FieldRow>
        <FieldRow label="Log AI requests"><Toggle value={false} /></FieldRow>
        <FieldRow label="Enable global system prompt"><Toggle value={true} /></FieldRow>
      </Section>
    </div>
  );
}

const EXAMPLE_FLAGS = [
  { key: 'ai_copilot',          name: 'AI Copilot',          enabled: false, rollout: 0,   desc: 'Message suggestion AI'           },
  { key: 'multi_workspace',     name: 'Multi-workspace',     enabled: false, rollout: 0,   desc: 'Allow users to join >1 workspace' },
  { key: 's4s_collaborations',  name: 'S4S Collaborations',  enabled: true,  rollout: 100, desc: 'Share-for-share feature set'      },
  { key: 'ai_post_optimizer',   name: 'AI Post Optimizer',   enabled: false, rollout: 0,   desc: 'Best-time scheduling AI'         },
  { key: 'connected_platforms', name: 'Connected Platforms', enabled: true,  rollout: 100, desc: 'Multi-platform connector UI'      },
];

function FeatureFlagsTab() {
  return (
    <div className="space-y-4">
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="border-b border-bg-border/40 px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">Feature flags</h2>
          <p className="text-xs text-text-muted mt-0.5">Control feature availability globally or per workspace</p>
        </div>
        <div className="border-b border-bg-border/40 px-4 py-2.5">
          <div className="grid grid-cols-5 text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em]">
            <span className="col-span-2">Flag</span>
            <span>Status</span>
            <span>Rollout</span>
            <span>Scope</span>
          </div>
        </div>
        <div className="divide-y divide-bg-border/40">
          {EXAMPLE_FLAGS.map((flag) => (
            <div key={flag.key} className="grid grid-cols-5 items-center px-4 py-3 hover:bg-bg-subtle/30 transition-colors">
              <div className="col-span-2">
                <p className="text-sm font-medium text-text-primary">{flag.name}</p>
                <code className="text-[10px] text-text-disabled">{flag.key}</code>
                <p className="text-xs text-text-muted mt-0.5">{flag.desc}</p>
              </div>
              <div>
                <span className={['inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                  flag.enabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-bg-subtle text-text-disabled'].join(' ')}>
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
      <p className="text-xs text-text-disabled text-center">Feature flags API not yet implemented.</p>
    </div>
  );
}

function APITab() {
  return (
    <div className="space-y-4">
      <Section title="Platform API">
        <FieldRow label="API base URL"><TextInput value="http://localhost:4000/v1" /></FieldRow>
        <FieldRow label="Enable public API"><Toggle value={false} /></FieldRow>
        <FieldRow label="Require API key"><Toggle value={true} /></FieldRow>
      </Section>
      <Section title="Rate limiting">
        <FieldRow label="Requests per minute (default)"><TextInput value="60" type="number" /></FieldRow>
        <FieldRow label="Burst multiplier"><TextInput value="3" type="number" /></FieldRow>
      </Section>
      <Section title="CORS">
        <FieldRow label="Allow all origins"><Toggle value={false} /></FieldRow>
        <FieldRow label="Allowed origins"><TextInput value="http://localhost:3000" /></FieldRow>
      </Section>
    </div>
  );
}

function IntegrationsTab() {
  return (
    <div className="space-y-4">
      <Section title="Webhooks">
        <FieldRow label="Webhook endpoint"><TextInput value="Not configured" /></FieldRow>
        <FieldRow label="Secret key"><TextInput value="Not configured" /></FieldRow>
        <FieldRow label="Enable webhooks"><Toggle value={false} /></FieldRow>
      </Section>
      <Section title="Webhook events">
        {['workspace.created', 'user.registered', 'subscription.changed', 'platform.connected'].map((ev) => (
          <FieldRow key={ev} label={ev}>
            <Toggle value={false} />
          </FieldRow>
        ))}
      </Section>
      <Section title="Slack">
        <FieldRow label="Slack webhook URL"><TextInput value="Not configured" /></FieldRow>
        <FieldRow label="Notify on new customer"><Toggle value={false} /></FieldRow>
        <FieldRow label="Notify on system errors"><Toggle value={false} /></FieldRow>
      </Section>
    </div>
  );
}

const TAB_CONTENT = {
  'general':       GeneralTab,
  'branding':      BrandingTab,
  'security':      SecurityTab,
  'email':         EmailTab,
  'storage':       StorageTab,
  'ai':            AISettingsTab,
  'api':           APITab,
  'feature-flags': FeatureFlagsTab,
  'integrations':  IntegrationsTab,
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const TabContent = TAB_CONTENT[activeTab];

  return (
    <div className="space-y-5 animate-fade-in">
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
          <Save size={14} />
          Save changes
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                active
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-surface border border-transparent',
              ].join(' ')}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <TabContent />

      <p className="text-xs text-text-disabled text-center">
        Settings API not yet implemented. Values shown are defaults for planning purposes.
      </p>
    </div>
  );
}
