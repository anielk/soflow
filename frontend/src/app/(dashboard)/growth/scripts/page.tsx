'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Button, Badge } from '@/components/ui';
import { Plus, Copy, Edit3, FileText, Search } from 'lucide-react';

type ScriptCategory = 'welcome' | 'ppv_upsell' | 'tip_request' | 'renewal' | 'follow_up' | 'custom';

interface Script {
  id:          string;
  name:        string;
  category:    ScriptCategory;
  content:     string;
  usageCount:  number;
  createdAt:   string;
}

const CATEGORY_CONFIG: Record<ScriptCategory, { label: string; color: string }> = {
  welcome:     { label: 'Welcome',     color: '#10B981' },
  ppv_upsell:  { label: 'PPV upsell',  color: '#8B5CF6' },
  tip_request: { label: 'Tip request', color: '#F59E0B' },
  renewal:     { label: 'Renewal',     color: '#3B82F6' },
  follow_up:   { label: 'Follow-up',   color: '#6366F1' },
  custom:      { label: 'Custom',      color: '#71717A' },
};

const MOCK_SCRIPTS: Script[] = [
  { id: 'sc1', name: 'Warm welcome', category: 'welcome', content: 'Hey [name]! So happy to have you here 🥰 I post exclusive content every week — make sure you check my vault for some special surprises I left just for you!', usageCount: 312, createdAt: '2026-03-01T00:00:00Z' },
  { id: 'sc2', name: 'New fan intro', category: 'welcome', content: 'Welcome [name]! Thanks for subscribing 💜 I\'m [creator] and I love connecting with my fans. Feel free to message me anytime — I read every message!', usageCount: 218, createdAt: '2026-03-10T00:00:00Z' },
  { id: 'sc3', name: 'PPV drop alert', category: 'ppv_upsell', content: 'Hey [name]! I just dropped something really exclusive in my vault 🔥 It\'s one of my best shoots ever and it\'s available for just [price]. Won\'t be up forever!', usageCount: 189, createdAt: '2026-04-01T00:00:00Z' },
  { id: 'sc4', name: 'Personalized PPV pitch', category: 'ppv_upsell', content: 'Hi [name]! I noticed you\'ve been a loyal fan and I wanted to share something special with you first before I send it to everyone. Check your messages!', usageCount: 94, createdAt: '2026-04-15T00:00:00Z' },
  { id: 'sc5', name: 'Gratitude tip', category: 'tip_request', content: 'Aww [name], you\'re the sweetest! If you\'re enjoying my content and want to show some love, even a small tip means the world to me 💕', usageCount: 78, createdAt: '2026-05-01T00:00:00Z' },
  { id: 'sc6', name: 'Sub expiry reminder', category: 'renewal', content: 'Hey [name]! Just a heads up that your subscription expires in [days] days. I\'d love to keep sharing my content with you — hope to see you stick around! 💜', usageCount: 156, createdAt: '2026-05-10T00:00:00Z' },
  { id: 'sc7', name: 'Re-engagement', category: 'follow_up', content: 'Hey [name]! It\'s been a while since I\'ve heard from you 🥺 I miss chatting! I\'ve been posting a lot of new content — come check it out!', usageCount: 67, createdAt: '2026-05-20T00:00:00Z' },
  { id: 'sc8', name: 'Custom holiday message', category: 'custom', content: 'Happy holidays [name]! 🎄 As a thank you for your support this year, I\'m giving a special 20% discount to all my loyal subs. Use code THANKS20!', usageCount: 43, createdAt: '2026-06-01T00:00:00Z' },
];

export default function ScriptsPage() {
  const router = useRouter();
  const [query,    setQuery]    = useState('');
  const [category, setCategory] = useState<'all' | ScriptCategory>('all');
  const [copied,   setCopied]   = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  function copyScript(id: string, content: string) {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const filtered = MOCK_SCRIPTS
    .filter((s) => category === 'all' || s.category === category)
    .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()) ||
                   s.content.toLowerCase().includes(query.toLowerCase()));

  const categories = Object.entries(CATEGORY_CONFIG) as [ScriptCategory, { label: string; color: string }][];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Scripts</h1>
          <p className="mt-1 text-sm text-text-muted">
            Reusable message templates for fan conversations
          </p>
        </div>
        <Button variant="primary" size="md" icon={Plus}>
          New script
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={[
              'px-2.5 py-1 rounded text-xs font-medium transition-colors duration-150',
              category === 'all'
                ? 'bg-violet-600/15 text-violet-400'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-subtle',
            ].join(' ')}
          >
            All ({MOCK_SCRIPTS.length})
          </button>
          {categories.map(([cat, { label }]) => {
            const count = MOCK_SCRIPTS.filter((s) => s.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={[
                  'px-2.5 py-1 rounded text-xs font-medium transition-colors duration-150',
                  category === cat
                    ? 'bg-violet-600/15 text-violet-400'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-subtle',
                ].join(' ')}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 px-3 h-8 bg-bg-subtle border border-bg-border/60 rounded-lg flex-1 min-w-[160px] max-w-xs ml-auto">
          <Search size={13} className="text-text-muted shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search scripts…"
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
          />
        </div>
      </div>

      {/* Scripts list */}
      {filtered.length === 0 ? (
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl py-16 flex flex-col items-center gap-3">
          <FileText size={32} className="text-text-disabled" />
          <p className="text-sm text-text-muted">No scripts match your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((script) => {
            const { label, color } = CATEGORY_CONFIG[script.category];
            return (
              <div
                key={script.id}
                className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 hover:border-violet-500/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text-primary">{script.name}</h3>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide"
                      style={{ color, background: `${color}18` }}
                    >
                      {label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => copyScript(script.id, script.content)}
                      className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-violet-400 transition-colors px-2 py-1 rounded hover:bg-bg-subtle"
                    >
                      <Copy size={11} />
                      {copied === script.id ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-violet-400 transition-colors px-2 py-1 rounded hover:bg-bg-subtle"
                    >
                      <Edit3 size={11} />
                      Edit
                    </button>
                  </div>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{script.content}</p>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-bg-border/40">
                  <span className="text-xs text-text-muted">
                    Used <span className="text-text-secondary tabular-nums">{script.usageCount}</span> times
                  </span>
                  <Badge variant="default" size="sm">
                    {['[name]', '[price]', '[days]', '[creator]'].filter((v) => script.content.includes(v)).length} variables
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
