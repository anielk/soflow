'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Badge, Button } from '@/components/ui';
import { FilePlus, Search, ChevronUp, ChevronDown, CalendarClock, ImageIcon, Video } from 'lucide-react';
import { timeUntil } from '@/lib/format';
import type { Post, PostType, MediaType } from '@/types/of-manager';

const MOCK_QUEUE: Post[] = [
  {
    id: '4', title: 'Cooking with me 🍝', caption: 'Making my favourite pasta recipe.',
    type: 'free', status: 'scheduled', scheduledAt: '2026-06-28T16:00:00Z',
    likes: 0, views: 0, comments: 0, earnings: 0, mediaCount: 2, mediaType: 'video',
  },
  {
    id: '5', title: 'Evening yoga session', caption: 'Wind down with a 30-minute yoga flow.',
    type: 'free', status: 'scheduled', scheduledAt: '2026-06-28T20:00:00Z',
    likes: 0, views: 0, comments: 0, earnings: 0, mediaCount: 1, mediaType: 'video',
  },
  {
    id: '6', title: 'Studio shoot — new outfits', caption: '',
    type: 'ppv', status: 'scheduled', price: 20, scheduledAt: '2026-06-29T12:00:00Z',
    likes: 0, views: 0, comments: 0, earnings: 0, mediaCount: 18, mediaType: 'image',
  },
  {
    id: '7', title: 'Morning run vlog', caption: 'My 5km Saturday morning run.',
    type: 'free', status: 'scheduled', scheduledAt: '2026-06-30T08:00:00Z',
    likes: 0, views: 0, comments: 0, earnings: 0, mediaCount: 1, mediaType: 'video',
  },
  {
    id: '8', title: 'Exclusive pool content', caption: '',
    type: 'ppv', status: 'scheduled', price: 30, scheduledAt: '2026-07-01T14:00:00Z',
    likes: 0, views: 0, comments: 0, earnings: 0, mediaCount: 8, mediaType: 'image',
  },
];

type SortField = 'scheduledAt' | 'title' | 'type';
type SortDir   = 'asc' | 'desc';

const MEDIA_COLOR: Record<MediaType, string> = { video: '#7C3AED', image: '#3B82F6' };

function PostTypeBadge({ type, price }: { type: PostType; price?: number }) {
  if (type === 'ppv' && price != null) {
    return <Badge variant="violet" size="sm">PPV · €{price}</Badge>;
  }
  return <Badge variant="success" size="sm">Free</Badge>;
}

export default function QueuePage() {
  const router = useRouter();
  const [query,     setQuery]     = useState('');
  const [sortField, setSortField] = useState<SortField>('scheduledAt');
  const [sortDir,   setSortDir]   = useState<SortDir>('asc');

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  const rows = [...MOCK_QUEUE]
    .filter((p) => p.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp size={12} className="text-text-disabled/40" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-violet-400" />
      : <ChevronDown size={12} className="text-violet-400" />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Queue</h1>
          <p className="mt-1 text-sm text-text-muted">{MOCK_QUEUE.length} posts scheduled</p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={FilePlus}
          onClick={() => router.push('/of-manager/new-post')}
        >
          Add to queue
        </Button>
      </div>

      {/* Card */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        {/* Search */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-bg-border/40">
          <Search size={13} className="text-text-muted shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts…"
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border/40">
                {[
                  { field: 'title' as const,       label: 'Post' },
                  { field: 'type' as const,         label: 'Type' },
                  { field: 'scheduledAt' as const,  label: 'Scheduled' },
                ].map(({ field, label }) => (
                  <th
                    key={field}
                    className="text-left text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5 cursor-pointer hover:text-text-secondary transition-colors"
                    onClick={() => toggleSort(field)}
                  >
                    <span className="flex items-center gap-1.5">
                      {label}
                      <SortIcon field={field} />
                    </span>
                  </th>
                ))}
                <th className="text-left text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5">
                  Status
                </th>
                <th className="px-4 py-2.5 w-12" />
              </tr>
            </thead>

            <tbody className="divide-y divide-bg-border/40">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CalendarClock size={24} className="text-text-muted" />
                      <p className="text-sm text-text-muted">No posts match your search</p>
                    </div>
                  </td>
                </tr>
              )}
              {rows.map((post) => {
                const color = MEDIA_COLOR[post.mediaType];
                return (
                  <tr
                    key={post.id}
                    className="hover:bg-bg-subtle/40 transition-colors duration-100"
                  >
                    {/* Post title */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${color}18` }}
                        >
                          {post.mediaType === 'video'
                            ? <Video size={13} style={{ color }} />
                            : <ImageIcon size={13} style={{ color }} />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{post.title}</p>
                          <p className="text-xs text-text-muted">{post.mediaCount} {post.mediaType === 'video' ? 'video' : 'photo'}{post.mediaCount > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <PostTypeBadge type={post.type} price={post.price} />
                    </td>

                    {/* Scheduled */}
                    <td className="px-4 py-3">
                      {post.scheduledAt ? (
                        <div>
                          <p className="text-text-primary tabular-nums">
                            {new Date(post.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            {' · '}
                            {new Date(post.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-xs text-text-muted">{timeUntil(post.scheduledAt)}</p>
                        </div>
                      ) : '—'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge variant="warning" size="sm">Scheduled</Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="text-xs text-text-muted hover:text-violet-400 transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
