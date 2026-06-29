'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Badge, Button } from '@/components/ui';
import { Plus, Search, ImageIcon, Lock, FolderOpen } from 'lucide-react';
import { relativeTime } from '@/lib/format';
import type { Collection } from '@/types/workspace';

const MOCK_COLLECTIONS: Collection[] = [
  {
    id: '1', name: 'Summer vibes 🌊', description: 'Full beach photoshoot series from June',
    mediaCount: 24, price: 25, createdAt: '2026-06-01T00:00:00Z',
  },
  {
    id: '2', name: 'Workout series', description: 'Complete workout routines — all levels',
    mediaCount: 12, price: undefined, createdAt: '2026-05-15T00:00:00Z',
  },
  {
    id: '3', name: 'BTS collection', description: 'Exclusive behind-the-scenes content',
    mediaCount: 8, price: 15, createdAt: '2026-05-01T00:00:00Z',
  },
  {
    id: '4', name: 'Studio sessions', description: 'Professional photo studio shoots',
    mediaCount: 31, price: 20, createdAt: '2026-04-10T00:00:00Z',
  },
  {
    id: '5', name: 'Daily vlogs', description: 'Day-in-the-life video series',
    mediaCount: 7, price: undefined, createdAt: '2026-03-20T00:00:00Z',
  },
];

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];

export default function CollectionsPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  const visible = MOCK_COLLECTIONS.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.description.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Content Collections</h1>
          <p className="mt-1 text-sm text-text-muted">
            Bundle content into purchasable collections for fans.
          </p>
        </div>
        <Button variant="primary" size="md" icon={Plus}>
          New collection
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 h-9 bg-bg-surface border border-bg-border/60 rounded-lg max-w-sm">
        <Search size={13} className="text-text-muted shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search collections…"
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
        />
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 rounded-xl bg-bg-subtle flex items-center justify-center">
              <FolderOpen size={18} className="text-text-muted" />
            </div>
            <p className="text-sm text-text-muted">No collections found</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((col, i) => {
            const accent = COLORS[i % COLORS.length];
            return (
              <div
                key={col.id}
                className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden hover:border-bg-muted hover:-translate-y-px transition-all duration-150 cursor-pointer group"
              >
                {/* Thumbnail strip */}
                <div
                  className="h-28 flex items-center justify-center"
                  style={{ background: `${accent}14` }}
                >
                  <div className="flex gap-1.5">
                    {Array.from({ length: Math.min(col.mediaCount, 4) }).map((_, j) => (
                      <div
                        key={j}
                        className="w-10 h-14 rounded-md flex items-center justify-center"
                        style={{ background: `${accent}28` }}
                      >
                        <ImageIcon size={12} style={{ color: accent }} className="opacity-60" />
                      </div>
                    ))}
                    {col.mediaCount > 4 && (
                      <div
                        className="w-10 h-14 rounded-md flex items-center justify-center"
                        style={{ background: `${accent}28` }}
                      >
                        <span className="text-[11px] font-semibold" style={{ color: accent }}>
                          +{col.mediaCount - 4}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-text-primary leading-tight">{col.name}</p>
                    {col.price != null
                      ? (
                        <Badge variant="violet" size="sm">
                          <Lock size={9} className="mr-0.5" />
                          €{col.price}
                        </Badge>
                      ) : (
                        <Badge variant="success" size="sm">Free</Badge>
                      )
                    }
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">{col.description}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-text-disabled">
                      {col.mediaCount} items
                    </span>
                    <span className="text-[11px] text-text-disabled">
                      Created {relativeTime(col.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Create new card */}
          <button
            type="button"
            className="bg-bg-surface border border-dashed border-bg-border/60 rounded-xl h-[220px] flex flex-col items-center justify-center gap-3 hover:border-violet-600/50 hover:bg-violet-600/[0.04] transition-colors duration-150 text-center px-6"
            onClick={() => {}}
          >
            <div className="w-10 h-10 rounded-xl bg-bg-overlay flex items-center justify-center">
              <Plus size={18} className="text-text-muted" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Create collection</p>
              <p className="text-xs text-text-muted mt-0.5">Bundle media into a package for fans</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
