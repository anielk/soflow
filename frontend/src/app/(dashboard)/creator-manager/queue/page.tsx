'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Badge, Button, EmptyState, useToast } from '@/components/ui';
import { FilePlus, Search, ChevronUp, ChevronDown, CalendarClock, Loader2, Trash2 } from 'lucide-react';
import { timeUntil } from '@/lib/format';
import { listPosts, deletePost } from '@/lib/posts';
import type { Post, PostType } from '@/types/workspace';

type SortField = 'scheduledAt' | 'caption' | 'type';
type SortDir   = 'asc' | 'desc';

function PostTypeBadge({ type, price }: { type: PostType; price?: number }) {
  if (type === 'ppv' && price != null) {
    return <Badge variant="violet" size="sm">PPV · €{price}</Badge>;
  }
  return <Badge variant="success" size="sm">Free</Badge>;
}

export default function QueuePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [posts,     setPosts]     = useState<Post[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [query,      setQuery]     = useState('');
  const [sortField,  setSortField] = useState<SortField>('scheduledAt');
  const [sortDir,    setSortDir]   = useState<SortDir>('asc');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoadError('');
    listPosts()
      .then(setPosts)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load posts'));
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
    else load();
  }, [router, load]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deletePost(id);
      setPosts((prev) => prev?.filter((p) => p.id !== id) ?? null);
      showToast('Post deleted', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete post', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  const rows = [...(posts ?? [])]
    .filter((p) => p.caption.toLowerCase().includes(query.toLowerCase()))
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
          <h1 className="text-xl font-semibold text-text-primary">Publishing Queue</h1>
          <p className="mt-1 text-sm text-text-muted">
            {posts ? `${posts.length} post${posts.length === 1 ? '' : 's'}` : 'Loading…'}
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={FilePlus}
          onClick={() => router.push('/creator-manager/new-post')}
        >
          New post
        </Button>
      </div>

      <p className="text-xs text-text-muted -mt-3">
        Drafts and scheduled posts here are real and persisted. There is no platform integration yet, so scheduled
        posts wait here rather than being automatically sent anywhere.
      </p>

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

        {loadError ? (
          <EmptyState icon={CalendarClock} title="Couldn't load posts" description={loadError} size="md" />
        ) : !posts ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-text-muted" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border/40">
                  {[
                    { field: 'caption' as const,      label: 'Post' },
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
                  <th className="px-4 py-2.5 w-20" />
                </tr>
              </thead>

              <tbody className="divide-y divide-bg-border/40">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <CalendarClock size={24} className="text-text-muted" />
                        <p className="text-sm text-text-muted">
                          {posts.length === 0 ? 'No drafts or scheduled posts yet' : 'No posts match your search'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                {rows.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-bg-subtle/40 transition-colors duration-100"
                  >
                    {/* Caption preview */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-text-primary truncate max-w-xs">
                          {post.caption || <span className="text-text-disabled italic">No caption</span>}
                        </p>
                        <p className="text-xs text-text-muted">
                          {post.mediaIds.length} file{post.mediaIds.length === 1 ? '' : 's'} attached
                        </p>
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
                      {post.status === 'scheduled'
                        ? <Badge variant="warning" size="sm">Scheduled</Badge>
                        : <Badge variant="default" size="sm">Draft</Badge>
                      }
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => router.push(`/creator-manager/new-post?id=${post.id}`)}
                        className="text-xs text-text-muted hover:text-violet-400 transition-colors mr-3"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === post.id}
                        onClick={() => handleDelete(post.id)}
                        className="text-text-muted hover:text-danger-text transition-colors disabled:opacity-50"
                      >
                        {deletingId === post.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
