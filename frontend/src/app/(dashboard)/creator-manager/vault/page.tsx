'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Badge, Button, Modal, Input } from '@/components/ui';
import { UploadDropzone, type UploadDropzoneHandle } from '@/components/media/UploadDropzone';
import { MediaThumbnail } from '@/components/media/MediaThumbnail';
import { MediaPreviewModal } from '@/components/media/MediaPreviewModal';
import { Upload, Search, Archive, Pencil, Trash2 } from 'lucide-react';
import { relativeTime } from '@/lib/format';
import { deleteMedia, listMedia, renameMedia } from '@/lib/media';
import type { MediaItem, MediaType } from '@/types/workspace';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3)   return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

type FilterType = 'all' | MediaType;
type SortOption = 'createdAt:desc' | 'createdAt:asc' | 'filename:asc' | 'filename:desc' | 'sizeBytes:desc' | 'sizeBytes:asc';

const SORT_LABELS: Record<SortOption, string> = {
  'createdAt:desc': 'Newest first',
  'createdAt:asc':  'Oldest first',
  'filename:asc':   'Name (A–Z)',
  'filename:desc':  'Name (Z–A)',
  'sizeBytes:desc': 'Largest first',
  'sizeBytes:asc':  'Smallest first',
};

export default function VaultPage() {
  const router = useRouter();
  const uploaderRef = useRef<UploadDropzoneHandle>(null);

  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterType>('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('createdAt:desc');
  const [showUploader, setShowUploader] = useState(false);

  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [renameItem, setRenameItem] = useState<MediaItem | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<MediaItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const [sortBy, sortDir] = sort.split(':') as ['createdAt' | 'filename' | 'sizeBytes', 'asc' | 'desc'];
    try {
      const result = await listMedia({
        search: debouncedQuery || undefined,
        type: filter === 'all' ? undefined : filter,
        sortBy,
        sortDir,
        limit: 200,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load media library');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filter, sort]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const totalSize = items.reduce((acc, v) => acc + v.sizeBytes, 0);

  const handleUploaded = () => {
    loadMedia();
  };

  const openRename = (item: MediaItem) => {
    setRenameItem(item);
    setRenameValue(item.originalFilename);
    setRenameError(null);
  };

  const submitRename = async () => {
    if (!renameItem) return;
    setBusyId(renameItem.id);
    setRenameError(null);
    try {
      await renameMedia(renameItem.id, renameValue.trim());
      setRenameItem(null);
      await loadMedia();
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : 'Failed to rename file');
    } finally {
      setBusyId(null);
    }
  };

  const submitDelete = async () => {
    if (!deleteItem) return;
    setBusyId(deleteItem.id);
    setDeleteError(null);
    try {
      await deleteMedia(deleteItem.id);
      setDeleteItem(null);
      await loadMedia();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete file');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Media Library</h1>
          <p className="mt-1 text-sm text-text-muted">
            {total} files · {formatBytes(totalSize)} loaded
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={Upload}
          onClick={() => {
            setShowUploader(true);
            uploaderRef.current?.openFileDialog();
          }}
        >
          Upload
        </Button>
      </div>

      {showUploader && (
        <UploadDropzone ref={uploaderRef} onUploaded={handleUploaded} />
      )}

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

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="h-8 px-3 bg-bg-surface border border-bg-border/60 rounded-lg text-xs text-text-secondary outline-none focus:border-violet-600"
        >
          {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
            <option key={option} value={option}>
              {SORT_LABELS[option]}
            </option>
          ))}
        </select>
      </div>

      {loadError && (
        <div className="bg-danger-subtle border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger-text">
          {loadError}
        </div>
      )}

      {/* Grid */}
      {!loading && items.length === 0 ? (
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
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden hover:border-bg-muted hover:-translate-y-px transition-all duration-150 group"
            >
              <div className="relative aspect-square cursor-pointer" onClick={() => setPreviewItem(item)}>
                <MediaThumbnail media={item} className="absolute inset-0 w-full h-full" />
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openRename(item);
                    }}
                    className="w-6 h-6 flex items-center justify-center rounded-md bg-black/60 text-white hover:bg-black/80"
                    aria-label="Rename"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteItem(item);
                      setDeleteError(null);
                    }}
                    className="w-6 h-6 flex items-center justify-center rounded-md bg-black/60 text-white hover:bg-danger"
                    aria-label="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-2 space-y-1">
                <p className="text-[11px] font-medium text-text-primary truncate">{item.originalFilename}</p>
                <div className="flex items-center justify-between gap-1">
                  <Badge variant={item.type === 'video' ? 'violet' : 'default'} size="sm">
                    {item.type === 'video' ? 'Video' : 'Photo'}
                  </Badge>
                  <span className="text-[10px] text-text-disabled">{formatBytes(item.sizeBytes)}</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] text-text-disabled truncate">{item.ownerName}</span>
                  <span className="text-[10px] text-text-disabled shrink-0">{relativeTime(item.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <MediaPreviewModal media={previewItem} onClose={() => setPreviewItem(null)} />

      <Modal open={Boolean(renameItem)} onClose={() => setRenameItem(null)} title="Rename file">
        <div className="space-y-4">
          <Input
            label="File name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            error={renameError ?? undefined}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRenameItem(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={busyId === renameItem?.id}
              disabled={!renameValue.trim()}
              onClick={submitRename}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(deleteItem)} onClose={() => setDeleteItem(null)} title="Delete file">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Delete <span className="font-medium text-text-primary">{deleteItem?.originalFilename}</span>? This cannot
            be undone.
          </p>
          {deleteError && <p className="text-xs text-danger-text">{deleteError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteItem(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" loading={busyId === deleteItem?.id} onClick={submitDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
