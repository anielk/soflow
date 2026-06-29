'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Button, Input } from '@/components/ui';
import { X, Plus, ShieldAlert, AlertCircle } from 'lucide-react';

type WordCategory = 'competitors' | 'platform_rules' | 'custom';

interface WordEntry {
  id:       string;
  word:     string;
  category: WordCategory;
}

const INIT_WORDS: WordEntry[] = [
  { id: 'w1',  word: 'fansly',      category: 'competitors'    },
  { id: 'w2',  word: 'patreon',     category: 'competitors'    },
  { id: 'w3',  word: 'fanvue',      category: 'competitors'    },
  { id: 'w4',  word: 'manyvids',    category: 'competitors'    },
  { id: 'w5',  word: 'snapchat',    category: 'platform_rules' },
  { id: 'w6',  word: 'cashapp',     category: 'platform_rules' },
  { id: 'w7',  word: 'paypal',      category: 'platform_rules' },
  { id: 'w8',  word: 'venmo',       category: 'platform_rules' },
  { id: 'w9',  word: 'discount',    category: 'custom'         },
  { id: 'w10', word: 'promo code',  category: 'custom'         },
];

const CATEGORY_CONFIG: Record<WordCategory, { label: string; color: string }> = {
  competitors:    { label: 'Competitors',    color: '#EF4444' },
  platform_rules: { label: 'Platform rules', color: '#F59E0B' },
  custom:         { label: 'Custom',         color: '#8B5CF6' },
};

export default function SensitiveWordsPage() {
  const router    = useRouter();
  const [words,   setWords]   = useState(INIT_WORDS);
  const [newWord, setNewWord] = useState('');
  const [newCat,  setNewCat]  = useState<WordCategory>('custom');
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  function addWord(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newWord.trim().toLowerCase();
    if (!trimmed) return;
    if (words.some((w) => w.word === trimmed)) {
      setError('This word is already in the list.');
      return;
    }
    setWords((prev) => [...prev, { id: `w${Date.now()}`, word: trimmed, category: newCat }]);
    setNewWord('');
    setError('');
  }

  function removeWord(id: string) {
    setWords((prev) => prev.filter((w) => w.id !== id));
  }

  const grouped = (['competitors', 'platform_rules', 'custom'] as WordCategory[]).map((cat) => ({
    category: cat,
    words: words.filter((w) => w.category === cat),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Sensitive Words</h1>
        <p className="mt-1 text-sm text-text-muted">
          Flag or block words in outgoing messages to stay compliant with platform rules
        </p>
      </div>

      {/* Info */}
      <div className="bg-warning/5 border border-warning/20 rounded-xl px-4 py-3.5 flex items-start gap-3">
        <AlertCircle size={14} className="text-warning-text mt-0.5 shrink-0" />
        <p className="text-xs text-text-secondary leading-relaxed">
          Words on this list will be flagged before sending. Chatters will see a warning when a blocked word appears in a message draft.
          This helps avoid platform terms-of-service violations.
        </p>
      </div>

      {/* Add word */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Add word</h3>
        <form onSubmit={addWord} className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <Input
              label="Word or phrase"
              value={newWord}
              onChange={(e) => { setNewWord(e.target.value); setError(''); }}
              placeholder="e.g. fansly"
              error={error}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">Category</label>
            <select
              value={newCat}
              onChange={(e) => setNewCat(e.target.value as WordCategory)}
              className="h-10 rounded bg-bg-subtle border border-bg-border text-text-primary text-sm px-3 outline-none focus:border-violet-600 transition-colors"
            >
              {(Object.entries(CATEGORY_CONFIG) as [WordCategory, { label: string }][]).map(([cat, { label }]) => (
                <option key={cat} value={cat}>{label}</option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="primary" size="md" icon={Plus}>
            Add
          </Button>
        </form>
      </div>

      {/* Word groups */}
      <div className="space-y-6">
        {grouped.map(({ category, words: catWords }) => {
          const { label, color } = CATEGORY_CONFIG[category];
          return (
            <div key={category} className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-bg-border/40">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={14} style={{ color }} />
                  <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded tabular-nums"
                    style={{ color, background: `${color}18` }}
                  >
                    {catWords.length}
                  </span>
                </div>
              </div>
              <div className="p-4">
                {catWords.length === 0 ? (
                  <p className="text-xs text-text-disabled py-2">No words in this category</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {catWords.map((entry) => (
                      <div
                        key={entry.id}
                        className="inline-flex items-center gap-1.5 bg-bg-subtle border border-bg-border/60 rounded-full px-3 py-1 text-sm text-text-secondary group"
                      >
                        <span>{entry.word}</span>
                        <button
                          type="button"
                          onClick={() => removeWord(entry.id)}
                          className="text-text-disabled hover:text-danger-text transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button variant="primary" size="md">Save word list</Button>
      </div>
    </div>
  );
}
