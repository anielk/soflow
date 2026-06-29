'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Badge, Button } from '@/components/ui';
import { Upload, Search, ImageIcon, Video, Archive } from 'lucide-react';
import { relativeTime } from '@/lib/format';
import type { VaultItem, MediaType } from '@/types/of-manager';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3)   return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

const MOCK_VAULT: VaultItem[] = [
  { id:  '1', type: 'video', filename: 'morning-workout.mp4',    sizeBytes: 134217728, uploadedAt: '2026-06-27T07:00:00Z' },
  { id:  '2', type: 'image', filename: 'selfie-studio-01.jpg',   sizeBytes: 2516582,   uploadedAt: '2026-06-26T14:00:00Z' },
  { id:  '3', type: 'image', filename: 'beach-bts-001.jpg',      sizeBytes: 3251200,   uploadedAt: '2026-06-26T13:45:00Z' },
  { id:  '4', type: 'image', filename: 'beach-bts-002.jpg',      sizeBytes: 2982400,   uploadedAt: '2026-06-26T13:44:00Z' },
  { id:  '5', type: 'video', filename: 'qa-june-2026.mp4',       sizeBytes: 88080384,  uploadedAt: '2026-06-25T18:00:00Z' },
  { id:  '6', type: 'image', filename: 'beach-bts-003.jpg',      sizeBytes: 4096000,   uploadedAt: '2026-06-24T10:00:00Z' },
  { id:  '7', type: 'image', filename: 'studio-shoot-001.jpg',   sizeBytes: 3174400,   uploadedAt: '2026-06-22T09:30:00Z' },
  { id:  '8', type: 'image', filename: 'studio-shoot-002.jpg',   sizeBytes: 2764800,   uploadedAt: '2026-06-22T09:28:00Z' },
  { id:  '9', type: 'video', filename: 'yoga-session-eve.mp4',   sizeBytes: 209715200, uploadedAt: '2026-06-20T19:00:00Z' },
  { id: '10', type: 'image', filename: 'cooking-thumbnail.jpg',  sizeBytes: 1843200,   uploadedAt: '2026-06-19T11:00:00Z' },
  { id: '11', type: 'image', filename: 'beach-bts-004.jpg',      sizeBytes: 3768320,   uploadedAt: '2026-06-18T15:00:00Z' },
  { id: '12', type: 'video', filename: 'workout-day2.mp4',       sizeBytes: 117440512, uploadedAt: '2026-06-15T07:00:00Z' },
];

type FilterType = 'all' | MediaType;

const MEDIA_COLOR: Record<MediaType, string> = { image: '#3B82F6', video: '#7C3AED' };

export default function VaultPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [query,  setQuery]  = useState('');

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  const visible = MOCK_VAULT
    .filter((v) => filter === 'all' || v.type === filter)
    .filter((v) => v.filename.toLowerCase().includes(query.toLowerCase()));

  const totalSize = MOCK_VAULT.reduce((acc, v) => acc + v.sizeBytes, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Vault</h1>
          <p className="mt-1 text-sm text-text-muted">
            {MOCK_VAULT.length} files · {formatBytes(totalSize)} used
          </p>
        </div>
        <Button variant="primary" size="md" icon={Upload}>
          Upload
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-bg-surface border border-bg-border/60 rounded-lg p-1">
          {(['all', 'image', 'video'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={[
                'px-3 py-1 rounded text-xs font-medium capitalize transition-colors duration-150',
                filter === t
                  ? 'bg-violet-600/15 text-violet-400'
                  : 'text-text-muted hover:text-text-secondary',
              ].join(' ')}
            >
              {t === 'all' ? 'All' : t === 'image' ? 'Photos' : 'Videos'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 h-8 bg-bg-surface border border-bg-border/60 rounded-lg flex-1 min-w-[160px] max-w-xs">
          <Search size={13} className="text-text-muted shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files…"
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
          />
        </div>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 rounded-xl bg-bg-subtle flex items-center justify-center">
              <Archive size={18} className="text-text-muted" />
            </div>
            <p className="text-sm text-text-muted">No media found</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {visible.map((item) => {
            const color = MEDIA_COLOR[item.type];
            return (
              <div
                key={item.id}
                className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden hover:border-bg-muted hover:-translate-y-px transition-all duration-150 group cursor-pointer"
              >
                {/* Thumbnail placeholder */}
                <div
                  className="aspect-square flex items-center justify-center"
                  style={{ background: `${color}14` }}
                >
                  {item.type === 'video'
                    ? <Video size={28} style={{ color }} className="opacity-60" />
                    : <ImageIcon size={28} style={{ color }} className="opacity-60" />
                  }
                </div>

                {/* Info */}
                <div className="p-2 space-y-1">
                  <p className="text-[11px] font-medium text-text-primary truncate">{item.filename}</p>
                  <div className="flex items-center justify-between gap-1">
                    <Badge variant={item.type === 'video' ? 'violet' : 'default'} size="sm">
                      {item.type === 'video' ? 'Video' : 'Photo'}
                    </Badge>
                    <span className="text-[10px] text-text-disabled">{formatBytes(item.sizeBytes)}</span>
                  </div>
                  <p className="text-[10px] text-text-disabled">{relativeTime(item.uploadedAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
