'use client';

import { Bot, Plus, ArrowRight, Database, Plug, Settings2, Layers } from 'lucide-react';

// These are UI-only descriptors for the architecture overview.
// NO providers are hardcoded as implementations.
// The actual providers live in the AIProvider database table.
const PLANNED_PROVIDERS = [
  { name: 'Ollama',       authType: 'none',    selfHosted: true,  slug: 'ollama'       },
  { name: 'OpenAI',       authType: 'api_key', selfHosted: false, slug: 'openai'       },
  { name: 'Anthropic',    authType: 'api_key', selfHosted: false, slug: 'anthropic'    },
  { name: 'Gemini',       authType: 'api_key', selfHosted: false, slug: 'gemini'       },
  { name: 'OpenRouter',   authType: 'api_key', selfHosted: false, slug: 'openrouter'   },
  { name: 'Groq',         authType: 'api_key', selfHosted: false, slug: 'groq'         },
  { name: 'Mistral',      authType: 'api_key', selfHosted: false, slug: 'mistral'      },
  { name: 'Azure OpenAI', authType: 'azure',   selfHosted: true,  slug: 'azure-openai' },
];

const DATA_MODELS = [
  {
    name: 'AIProvider',
    icon: Database,
    color: '#8B5CF6',
    fields: ['id', 'name', 'slug', 'baseUrl?', 'authType', 'isEnabled'],
    desc: 'One row per registered provider. Slug is the stable API identifier.',
  },
  {
    name: 'AIModel',
    icon: Layers,
    color: '#3B82F6',
    fields: ['id', 'providerId', 'name', 'modelId', 'contextWindow?', 'capabilities[]'],
    desc: 'Models belong to a provider. Multiple models per provider are supported.',
  },
  {
    name: 'AIConnection',
    icon: Plug,
    color: '#10B981',
    fields: ['id', 'workspaceId', 'providerId', 'encryptedKey?', 'baseUrl?', 'isActive'],
    desc: 'Links a workspace to a provider. API keys are stored encrypted.',
  },
  {
    name: 'AISettings',
    icon: Settings2,
    color: '#F59E0B',
    fields: ['id', 'workspaceId?', 'defaultProviderId?', 'defaultModelId?', 'temperature', 'maxTokens'],
    desc: 'workspaceId null = platform global default. Workspace settings override global.',
  },
];

export default function AdminAIPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">AI</h1>
          <p className="text-sm text-text-muted mt-0.5">Provider configuration and model management</p>
        </div>
        <button
          type="button"
          disabled
          className="flex items-center gap-2 px-3.5 py-2 bg-violet-600/40 text-violet-300/60 text-sm font-medium rounded-lg cursor-not-allowed"
        >
          <Plus size={14} />
          Add provider
        </button>
      </div>

      {/* Architecture overview */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5">
        <p className="text-xs font-semibold text-text-disabled uppercase tracking-[0.06em] mb-4">
          Provider architecture
        </p>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          AI providers are registered in the database — not hardcoded in application code.
          Each provider row defines how to authenticate and call that provider&apos;s API.
          Adding a new provider (e.g. a new Ollama endpoint) requires no code deployment.
        </p>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {['AIProvider (DB)', '→', 'AIModel (DB)', '→', 'AIConnection per workspace', '→', 'AI feature in product'].map((item, i) => (
            <span
              key={i}
              className={
                item === '→'
                  ? 'text-text-disabled'
                  : 'px-2.5 py-1.5 bg-violet-600/10 border border-violet-500/20 rounded-lg text-violet-300 font-medium'
              }
            >
              {item}
            </span>
          ))}
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

      {/* Planned providers */}
      <div>
        <p className="text-xs font-semibold text-text-disabled uppercase tracking-[0.06em] mb-3">
          Planned providers — not yet configured
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {PLANNED_PROVIDERS.map((p) => (
            <div
              key={p.slug}
              className="bg-bg-surface border border-bg-border/60 border-dashed rounded-xl p-3.5 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-secondary">{p.name}</span>
                {p.selfHosted && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-600/15 text-blue-400 rounded font-medium">
                    self-hosted
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-text-disabled">
                <span>auth:</span>
                <code className="text-text-muted">{p.authType}</code>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-text-disabled">
                <span>slug:</span>
                <code className="text-text-muted">{p.slug}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active providers table */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <div className="border-b border-bg-border/40 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Configured providers</h2>
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Manage <ArrowRight size={11} />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Bot size={28} className="text-text-disabled" strokeWidth={1.2} />
          <p className="text-sm font-medium text-text-secondary">No providers configured</p>
          <p className="text-xs text-text-muted">
            Providers are added to the AIProvider table. No code changes required.
          </p>
        </div>
      </div>
    </div>
  );
}
