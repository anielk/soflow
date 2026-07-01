'use client';

import { useState } from 'react';
import { Bot, CheckCircle2, AlertCircle, Clock, Database, Plug, Settings2, Layers, Cpu, FileText, Sliders, Network, Play } from 'lucide-react';

// UI-only descriptors — providers live in the AIProvider database table, not in this file.
const PROVIDER_DESCRIPTORS = [
  { name: 'Ollama',       slug: 'ollama',       authType: 'none',    selfHosted: true,  status: 'not_configured' as const },
  { name: 'OpenAI',       slug: 'openai',       authType: 'api_key', selfHosted: false, status: 'not_configured' as const },
  { name: 'Anthropic',    slug: 'anthropic',    authType: 'api_key', selfHosted: false, status: 'not_configured' as const },
  { name: 'Gemini',       slug: 'gemini',       authType: 'api_key', selfHosted: false, status: 'not_configured' as const },
  { name: 'OpenRouter',   slug: 'openrouter',   authType: 'api_key', selfHosted: false, status: 'not_configured' as const },
  { name: 'Groq',         slug: 'groq',         authType: 'api_key', selfHosted: false, status: 'not_configured' as const },
  { name: 'Mistral',      slug: 'mistral',      authType: 'api_key', selfHosted: false, status: 'not_configured' as const },
  { name: 'Azure OpenAI', slug: 'azure-openai', authType: 'azure',   selfHosted: true,  status: 'not_configured' as const },
];

const AI_TASKS = [
  { key: 'content_generation',  label: 'Content Generation',  desc: 'Generate captions, posts, and scripts'    },
  { key: 'message_suggestions', label: 'Message Suggestions', desc: 'Suggest replies to fan messages'          },
  { key: 'post_optimization',   label: 'Post Optimization',   desc: 'Improve timing, hashtags, and copy'       },
  { key: 'fan_insights',        label: 'Fan Insights',        desc: 'Summarize fan behavior and preferences'   },
  { key: 'sentiment_analysis',  label: 'Sentiment Analysis',  desc: 'Analyze fan message sentiment'            },
  { key: 'image_captioning',    label: 'Image Captioning',    desc: 'Auto-generate captions for media'         },
];

const DATA_MODELS = [
  { name: 'AIProvider',   icon: Database,  color: '#8B5CF6', fields: ['id', 'name', 'slug', 'baseUrl?', 'authType', 'isEnabled'],                           desc: 'One row per registered provider. Slug is the stable API identifier.' },
  { name: 'AIModel',      icon: Layers,    color: '#3B82F6', fields: ['id', 'providerId', 'name', 'modelId', 'contextWindow?', 'capabilities[]'],           desc: 'Models belong to a provider. Multiple models per provider.' },
  { name: 'AIConnection', icon: Plug,      color: '#10B981', fields: ['id', 'workspaceId', 'providerId', 'encryptedKey?', 'baseUrl?', 'isActive'],          desc: 'Links a workspace to a provider. API keys stored encrypted.' },
  { name: 'AISettings',   icon: Settings2, color: '#F59E0B', fields: ['id', 'workspaceId?', 'defaultProviderId?', 'defaultModelId?', 'temperature', 'maxTokens'], desc: 'workspaceId null = platform global default.' },
];

type Tab = 'providers' | 'models' | 'tasks' | 'connections' | 'system-prompt' | 'default-models' | 'test';

const TABS: { id: Tab; label: string; icon: typeof Bot }[] = [
  { id: 'providers',      label: 'Providers',      icon: Bot      },
  { id: 'models',         label: 'Models',          icon: Cpu      },
  { id: 'tasks',          label: 'Tasks',           icon: Layers   },
  { id: 'connections',    label: 'Connections',     icon: Network  },
  { id: 'system-prompt',  label: 'System Prompt',   icon: FileText },
  { id: 'default-models', label: 'Default Models',  icon: Sliders  },
  { id: 'test',           label: 'Connection Test', icon: Play     },
];

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  active:          { label: 'Active',          cls: 'bg-emerald-500/15 text-emerald-400' },
  not_configured:  { label: 'Not configured',  cls: 'bg-bg-subtle text-text-disabled'    },
  error:           { label: 'Error',           cls: 'bg-red-500/15 text-red-400'         },
};

function ProvidersTab() {
  return (
    <div className="space-y-5">
      {/* Architecture callout */}
      <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-4">
        <p className="text-xs font-semibold text-violet-300 mb-1.5">Dynamic provider architecture</p>
        <p className="text-xs text-text-muted leading-relaxed">
          AI providers are registered in the <code className="text-violet-300">AIProvider</code> database table — not hardcoded.
          Adding a new provider requires no code deployment. The slug is the stable runtime identifier.
        </p>
        <div className="flex items-center gap-2 flex-wrap mt-3 text-xs">
          {['AIProvider (DB)', '→', 'AIModel (DB)', '→', 'AIConnection / workspace', '→', 'AI feature'].map((item, i) => (
            <span key={i} className={item === '→' ? 'text-text-disabled' : 'px-2 py-1 bg-violet-600/15 border border-violet-500/20 rounded-lg text-violet-300 font-medium'}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Provider grid */}
      <div>
        <p className="text-xs font-semibold text-text-disabled uppercase tracking-[0.06em] mb-3">All providers — UI reference only</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {PROVIDER_DESCRIPTORS.map((p) => {
            const chip = STATUS_CHIP[p.status];
            return (
              <div key={p.slug} className="bg-bg-surface border border-bg-border/60 border-dashed rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text-secondary">{p.name}</span>
                  {p.selfHosted && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-600/15 text-blue-400 rounded font-medium shrink-0">self-hosted</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-text-disabled">
                  auth: <code className="text-text-muted">{p.authType}</code>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-text-disabled">
                  slug: <code className="text-text-muted">{p.slug}</code>
                </div>
                <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium ${chip.cls}`}>{chip.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data models */}
      <div>
        <p className="text-xs font-semibold text-text-disabled uppercase tracking-[0.06em] mb-3">Database models</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {DATA_MODELS.map(({ name, icon: Icon, color, fields, desc }) => (
            <div key={name} className="bg-bg-surface border border-bg-border/60 rounded-xl p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                  <Icon size={13} style={{ color }} />
                </div>
                <code className="text-sm font-semibold text-text-primary">{name}</code>
              </div>
              <p className="text-xs text-text-muted leading-relaxed mb-3">{desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {fields.map((f) => (
                  <code key={f} className="text-[11px] px-1.5 py-0.5 bg-bg-subtle rounded text-text-secondary">{f}</code>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModelsTab() {
  return (
    <div className="space-y-4">
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="border-b border-bg-border/40 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Model registry</h2>
          <span className="text-xs text-text-disabled">Populated from AIModel table</span>
        </div>
        <div className="grid grid-cols-5 text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5 border-b border-bg-border/40">
          <span className="col-span-2">Model</span>
          <span>Provider</span>
          <span>Context</span>
          <span>Capabilities</span>
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Cpu size={28} className="text-text-disabled" strokeWidth={1.2} />
          <p className="text-sm font-medium text-text-secondary">No models registered</p>
          <p className="text-xs text-text-muted">Models are added per provider in the AIModel table.</p>
        </div>
      </div>
      <p className="text-xs text-text-disabled text-center">Model API not yet implemented.</p>
    </div>
  );
}

function TasksTab() {
  return (
    <div className="space-y-4">
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="border-b border-bg-border/40 px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">AI task types</h2>
          <p className="text-xs text-text-muted mt-0.5">Each task type can have a default model assigned</p>
        </div>
        <div className="divide-y divide-bg-border/40">
          {AI_TASKS.map((task) => (
            <div key={task.key} className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-sm font-medium text-text-primary">{task.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{task.desc}</p>
                <code className="text-[10px] text-text-disabled">{task.key}</code>
              </div>
              <span className="text-xs text-text-disabled italic shrink-0 ml-4">No model assigned</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConnectionsTab() {
  return (
    <div className="space-y-4">
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="border-b border-bg-border/40 px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">Workspace connections</h2>
          <p className="text-xs text-text-muted mt-0.5">Each workspace can connect to one or more AI providers</p>
        </div>
        <div className="grid grid-cols-5 text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5 border-b border-bg-border/40">
          <span className="col-span-2">Workspace</span>
          <span>Provider</span>
          <span>Status</span>
          <span>Connected</span>
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Network size={28} className="text-text-disabled" strokeWidth={1.2} />
          <p className="text-sm font-medium text-text-secondary">No workspace connections</p>
          <p className="text-xs text-text-muted">Workspaces connect to providers via the AIConnection table.</p>
        </div>
      </div>
    </div>
  );
}

function SystemPromptTab() {
  return (
    <div className="space-y-4">
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="border-b border-bg-border/40 px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">Global system prompt</h2>
          <p className="text-xs text-text-muted mt-0.5">Applied to all AI requests unless overridden by workspace</p>
        </div>
        <div className="p-4">
          <textarea
            disabled
            rows={10}
            defaultValue="You are an AI assistant for Leinaflow, a creator management platform. You help agencies manage their creators efficiently and professionally. Always be concise, professional, and focused on the creator economy context."
            className="w-full bg-bg-subtle border border-bg-border rounded-lg px-3 py-2.5 text-sm text-text-secondary font-mono leading-relaxed resize-none focus:outline-none cursor-not-allowed"
          />
        </div>
        <div className="border-t border-bg-border/40 px-4 py-3">
          <button type="button" disabled className="px-3.5 py-2 bg-violet-600/40 text-violet-300/60 text-sm font-medium rounded-lg cursor-not-allowed">
            Save system prompt
          </button>
          <span className="text-xs text-text-disabled ml-3">API not yet implemented</span>
        </div>
      </div>
    </div>
  );
}

function DefaultModelsTab() {
  return (
    <div className="space-y-4">
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="border-b border-bg-border/40 px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">Default model assignments</h2>
          <p className="text-xs text-text-muted mt-0.5">Platform-wide defaults — workspaces can override per connection</p>
        </div>
        <div className="divide-y divide-bg-border/40">
          {AI_TASKS.map((task) => (
            <div key={task.key} className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-sm font-medium text-text-primary">{task.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{task.desc}</p>
              </div>
              <select
                disabled
                className="ml-4 w-44 px-3 py-1.5 bg-bg-subtle border border-bg-border rounded-lg text-xs text-text-disabled focus:outline-none cursor-not-allowed"
              >
                <option>No model selected</option>
              </select>
            </div>
          ))}
        </div>
        <div className="border-t border-bg-border/40 px-4 py-3">
          <button type="button" disabled className="px-3.5 py-2 bg-violet-600/40 text-violet-300/60 text-sm font-medium rounded-lg cursor-not-allowed">
            Save defaults
          </button>
          <span className="text-xs text-text-disabled ml-3">No providers configured yet</span>
        </div>
      </div>
    </div>
  );
}

function ConnectionTestTab() {
  return (
    <div className="space-y-4">
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="border-b border-bg-border/40 px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">Connection test</h2>
          <p className="text-xs text-text-muted mt-0.5">Verify a provider API key is working correctly</p>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Provider</label>
            <select disabled className="w-full px-3 py-2 bg-bg-subtle border border-bg-border rounded-lg text-sm text-text-disabled focus:outline-none cursor-not-allowed">
              <option>Select a provider</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">API key / endpoint</label>
            <input
              disabled
              type="password"
              placeholder="Will use the stored encrypted key"
              className="w-full px-3 py-2 bg-bg-subtle border border-bg-border rounded-lg text-sm text-text-disabled placeholder-text-disabled focus:outline-none cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Test prompt</label>
            <input
              disabled
              type="text"
              defaultValue="Say hello in one sentence."
              className="w-full px-3 py-2 bg-bg-subtle border border-bg-border rounded-lg text-sm text-text-disabled focus:outline-none cursor-not-allowed"
            />
          </div>
          <button type="button" disabled className="flex items-center gap-2 px-3.5 py-2 bg-violet-600/40 text-violet-300/60 text-sm font-medium rounded-lg cursor-not-allowed">
            <Play size={13} />
            Run test
          </button>
        </div>
        <div className="border-t border-bg-border/40 px-4 py-4 flex flex-col items-center gap-2">
          <AlertCircle size={20} className="text-text-disabled" strokeWidth={1.3} />
          <p className="text-xs text-text-disabled">No test result — configure a provider first</p>
        </div>
      </div>

      {/* Provider status overview */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="border-b border-bg-border/40 px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">Provider status overview</h2>
        </div>
        <div className="divide-y divide-bg-border/40">
          {PROVIDER_DESCRIPTORS.map((p) => (
            <div key={p.slug} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Clock size={13} className="text-text-disabled" />
                <span className="text-sm text-text-secondary">{p.name}</span>
                {p.selfHosted && <span className="text-[10px] px-1.5 py-0.5 bg-blue-600/15 text-blue-400 rounded">self-hosted</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-disabled italic">Not configured</span>
                <button type="button" disabled className="text-xs text-violet-400/40 cursor-not-allowed">Test</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TAB_CONTENT = {
  'providers':      ProvidersTab,
  'models':         ModelsTab,
  'tasks':          TasksTab,
  'connections':    ConnectionsTab,
  'system-prompt':  SystemPromptTab,
  'default-models': DefaultModelsTab,
  'test':           ConnectionTestTab,
};

export default function AdminAIPage() {
  const [activeTab, setActiveTab] = useState<Tab>('providers');
  const TabContent = TAB_CONTENT[activeTab];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">AI Administration</h1>
        <p className="text-sm text-text-muted mt-0.5">Provider configuration, model management, and AI settings</p>
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

      {/* Tab content */}
      <TabContent />
    </div>
  );
}
