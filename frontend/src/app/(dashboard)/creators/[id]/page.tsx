'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import {
  Badge, Button, Modal, Input, Textarea, EmptyState, Skeleton, Tooltip, useToast,
} from '@/components/ui';
import { CreatorAvatar } from '@/components/creators/CreatorAvatar';
import { UploadDropzone, type UploadDropzoneHandle } from '@/components/media/UploadDropzone';
import { MediaThumbnail } from '@/components/media/MediaThumbnail';
import { MediaPreviewModal } from '@/components/media/MediaPreviewModal';
import {
  ArrowLeft, Users, ImageIcon, Video, FileText, HardDrive, Upload, Search, SearchX,
  Pencil, Trash2, Star, Archive, RotateCcw, Mail, Phone, X as XIcon, HelpCircle, History, ShieldCheck,
} from 'lucide-react';
import { relativeTime } from '@/lib/format';
import { getCreator, getCreatorStats, updateCreator, deleteCreator, listCreatorActivity, listCreatorAuditLog } from '@/lib/workspace';
import { deleteMedia, listMedia, renameMedia } from '@/lib/media';
import type {
  ActivityLogItem, AuditLogItem, CreatorRecord, CreatorStats, CreatorStatus, MediaItem, MediaType,
} from '@/types/workspace';

type Tab = 'overview' | 'profile' | 'media' | 'activity' | 'audit';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

const STATUS_BADGE: Record<CreatorStatus, { variant: 'success' | 'warning' | 'default'; label: string }> = {
  ACTIVE: { variant: 'success', label: 'Active' },
  PAUSED: { variant: 'warning', label: 'Paused' },
  ARCHIVED: { variant: 'default', label: 'Archived' },
};

const MEDIA_TYPE_LABEL: Record<MediaType, string> = { image: 'Photo', video: 'Video', document: 'Document' };
const MEDIA_TYPE_BADGE_VARIANT: Record<MediaType, 'violet' | 'default' | 'warning'> = {
  video: 'violet', image: 'default', document: 'warning',
};

// ---------- Overview tab ----------------------------------------------------

function OverviewTab({ creator, stats, statsLoading }: { creator: CreatorRecord; stats: CreatorStats | null; statsLoading: boolean }) {
  const cards = [
    { label: 'Media files', value: stats ? String(stats.mediaCount) : '—', icon: ImageIcon, color: '#8B5CF6' },
    { label: 'Images', value: stats ? String(stats.imageCount) : '—', icon: ImageIcon, color: '#3B82F6' },
    { label: 'Videos', value: stats ? String(stats.videoCount) : '—', icon: Video, color: '#7C3AED' },
    { label: 'Documents', value: stats ? String(stats.documentCount) : '—', icon: FileText, color: '#F59E0B' },
    { label: 'Storage used', value: stats ? formatBytes(stats.storageBytes) : '—', icon: HardDrive, color: '#10B981' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={68} rounded="lg" />)
        ) : (
          cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-disabled">{label}</p>
                <p className="mt-0.5 text-base font-bold text-text-primary tabular-nums leading-none">{value}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-bg-border/40">
          <h3 className="text-sm font-semibold text-text-primary">General information</h3>
        </div>
        <dl className="divide-y divide-bg-border/40">
          {[
            { label: 'Email', value: creator.email || '—' },
            { label: 'Phone', value: creator.phone || '—' },
            { label: 'Tags', value: creator.tags.length > 0 ? creator.tags.join(', ') : '—' },
            { label: 'Added', value: new Date(creator.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) },
            { label: 'Last updated', value: relativeTime(creator.updatedAt) },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-4 px-4 py-2.5">
              <dt className="text-xs text-text-muted w-36 shrink-0 pt-0.5">{label}</dt>
              <dd className="text-sm text-text-primary">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-bg-border/40">
          <h3 className="text-sm font-semibold text-text-primary">Biography</h3>
        </div>
        <div className="px-4 py-4">
          {creator.bio ? (
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{creator.bio}</p>
          ) : (
            <p className="text-sm text-text-muted italic">No biography added yet.</p>
          )}
        </div>
      </div>

      {creator.notes && (
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-bg-border/40">
            <h3 className="text-sm font-semibold text-text-primary">Notes</h3>
          </div>
          <div className="px-4 py-4">
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{creator.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Profile tab ------------------------------------------------------

function ProfileTab({
  creator,
  onSaved,
  onArchiveOrRestore,
  onDelete,
}: {
  creator: CreatorRecord;
  onSaved: (updated: CreatorRecord) => void;
  onArchiveOrRestore: () => void;
  onDelete: () => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState(creator.name);
  const [email, setEmail] = useState(creator.email ?? '');
  const [phone, setPhone] = useState(creator.phone ?? '');
  const [bio, setBio] = useState(creator.bio ?? '');
  const [notes, setNotes] = useState(creator.notes ?? '');
  const [status, setStatus] = useState<CreatorStatus>(creator.status);
  const [tagsDraft, setTagsDraft] = useState<string[]>(creator.tags);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setName(creator.name);
    setEmail(creator.email ?? '');
    setPhone(creator.phone ?? '');
    setBio(creator.bio ?? '');
    setNotes(creator.notes ?? '');
    setStatus(creator.status);
    setTagsDraft(creator.tags);
  }, [creator]);

  function addTag() {
    const t = tagInput.trim();
    if (t && !tagsDraft.includes(t)) setTagsDraft((prev) => [...prev, t]);
    setTagInput('');
  }

  function removeTag(t: string) {
    setTagsDraft((prev) => prev.filter((x) => x !== t));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateCreator(creator.id, {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        notes: notes.trim() || null,
        tags: tagsDraft,
        status,
      });
      onSaved(updated);
      showToast('Creator profile updated', 'success');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update creator');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 space-y-4">
          <h3 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em]">
            General information
          </h3>
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} leadingIcon={Mail} />
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} leadingIcon={Phone} />
        </div>

        <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 space-y-4">
          <h3 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em]">
            Biography &amp; notes
          </h3>
          <Textarea
            label="Biography"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 2000))}
            rows={4}
            placeholder="Public-facing bio for this creator…"
            hint={`${bio.length} / 2000`}
          />
          <Textarea
            label="Internal notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 5000))}
            rows={4}
            placeholder="Notes only your team can see…"
            hint={`${notes.length} / 5000`}
          />
        </div>

        <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 space-y-3">
          <h3 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em]">Tags</h3>
          <div className="flex flex-wrap gap-1.5">
            {tagsDraft.map((t) => (
              <Badge key={t} variant="violet" size="sm" className="gap-1">
                {t}
                <button type="button" onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`}>
                  <XIcon size={10} />
                </button>
              </Badge>
            ))}
            {tagsDraft.length === 0 && <span className="text-xs text-text-muted">No tags yet</span>}
          </div>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add a tag and press Enter…"
              className="flex-1"
            />
            <Button type="button" variant="secondary" size="md" onClick={addTag} disabled={!tagInput.trim()}>
              Add
            </Button>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 space-y-3">
          <h3 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em]">Status</h3>
          <div className="flex items-center gap-1 bg-bg-subtle border border-bg-border/60 rounded-lg p-1 w-fit">
            {(['ACTIVE', 'PAUSED', 'ARCHIVED'] as CreatorStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={[
                  'px-3 py-1 rounded text-xs font-medium transition-colors duration-150',
                  status === s ? 'bg-violet-600/15 text-violet-400' : 'text-text-muted hover:text-text-secondary',
                ].join(' ')}
              >
                {STATUS_BADGE[s].label}
              </button>
            ))}
          </div>
        </div>

        {saveError && <p className="text-xs text-danger-text">{saveError}</p>}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md" loading={saving} disabled={!name.trim()}>
            Save changes
          </Button>
        </div>
      </form>

      <div className="bg-bg-surface border border-danger/20 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-danger-text mb-1">Danger zone</h3>
        <p className="text-xs text-text-muted mb-3">
          {creator.status === 'ARCHIVED'
            ? 'This creator is archived. Restore it to make it active again, or delete it permanently.'
            : 'Archiving hides this creator from active workflows without deleting their data. Deleting is permanent.'}
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={creator.status === 'ARCHIVED' ? RotateCcw : Archive}
            onClick={onArchiveOrRestore}
          >
            {creator.status === 'ARCHIVED' ? 'Restore creator' : 'Archive creator'}
          </Button>
          <Button variant="danger" size="sm" icon={Trash2} onClick={onDelete}>
            Delete permanently
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Media tab ---------------------------------------------------------

function MediaTab({ creatorId, avatarUrl, onAvatarChanged }: { creatorId: string; avatarUrl: string | null; onAvatarChanged: (mediaId: string | null) => void }) {
  const { showToast } = useToast();
  const uploaderRef = useRef<UploadDropzoneHandle>(null);

  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showUploader, setShowUploader] = useState(false);

  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [renameItem, setRenameItem] = useState<MediaItem | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<MediaItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await listMedia({ creatorId, search: debouncedQuery || undefined, sortBy: 'createdAt', sortDir: 'desc', limit: 200 });
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load media library');
    } finally {
      setLoading(false);
    }
  }, [creatorId, debouncedQuery]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const totalSize = items.reduce((acc, v) => acc + v.sizeBytes, 0);
  const isFiltered = debouncedQuery.trim() !== '';

  const handleUploaded = () => {
    loadMedia();
    showToast('Media uploaded', 'success');
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
      showToast('File renamed', 'success');
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
      if (deleteItem.id === avatarUrl) onAvatarChanged(null);
      setDeleteItem(null);
      await loadMedia();
      showToast('File deleted', 'success');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete file');
    } finally {
      setBusyId(null);
    }
  };

  const setAsAvatar = async (item: MediaItem) => {
    setBusyId(item.id);
    try {
      await updateCreator(creatorId, { avatarUrl: item.id });
      onAvatarChanged(item.id);
      showToast('Profile photo updated', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to set profile photo', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-text-primary">Media library</h3>
            <Tooltip content="Photos, videos, and documents for this creator only." side="right">
              <HelpCircle size={13} className="text-text-disabled hover:text-text-muted transition-colors duration-150" />
            </Tooltip>
          </div>
          <p className="mt-1 text-xs text-text-muted">{total} files · {formatBytes(totalSize)} loaded</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={Upload}
          onClick={() => {
            setShowUploader(true);
            uploaderRef.current?.openFileDialog();
          }}
        >
          Upload
        </Button>
      </div>

      {showUploader && <UploadDropzone ref={uploaderRef} creatorId={creatorId} onUploaded={handleUploaded} />}

      <div className="flex items-center gap-2 px-3 h-8 bg-bg-surface border border-bg-border/60 rounded-lg max-w-xs">
        <Search size={13} className="text-text-muted shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files…"
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
        />
      </div>

      {loadError && (
        <div className="bg-danger-subtle border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger-text">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
              <Skeleton className="aspect-square" rounded="sm" />
              <div className="p-2 space-y-1.5">
                <Skeleton width="80%" height={11} rounded="sm" />
                <Skeleton width="45%" height={10} rounded="sm" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
          {isFiltered ? (
            <EmptyState
              icon={SearchX}
              title="No files match your search"
              description="Try a different search term or clear the search to see everything in this creator's library."
              action={{ label: 'Clear search', onClick: () => setQuery('') }}
            />
          ) : (
            <EmptyState
              icon={ImageIcon}
              title="No media yet"
              description="Upload photos, videos, or documents for this creator to build their media library."
              action={{
                label: 'Upload the first file',
                onClick: () => {
                  setShowUploader(true);
                  uploaderRef.current?.openFileDialog();
                },
              }}
            />
          )}
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
                {item.id === avatarUrl && (
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-violet-600 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                    <Star size={10} fill="currentColor" /> Profile photo
                  </div>
                )}
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  {item.type === 'image' && item.id !== avatarUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAsAvatar(item);
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded-md bg-black/60 text-white hover:bg-violet-600"
                      aria-label="Set as profile photo"
                    >
                      <Star size={12} />
                    </button>
                  )}
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

              <div className="p-2 space-y-1">
                <p className="text-[11px] font-medium text-text-primary truncate">{item.originalFilename}</p>
                <div className="flex items-center justify-between gap-1">
                  <Badge variant={MEDIA_TYPE_BADGE_VARIANT[item.type]} size="sm">{MEDIA_TYPE_LABEL[item.type]}</Badge>
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
          <Input label="File name" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} error={renameError ?? undefined} autoFocus />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRenameItem(null)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={busyId === renameItem?.id} disabled={!renameValue.trim()} onClick={submitRename}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(deleteItem)} onClose={() => setDeleteItem(null)} title="Delete file">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Delete <span className="font-medium text-text-primary">{deleteItem?.originalFilename}</span>? This cannot be undone.
          </p>
          {deleteError && <p className="text-xs text-danger-text">{deleteError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button variant="danger" size="sm" loading={busyId === deleteItem?.id} onClick={submitDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ---------- Activity / Audit tabs -------------------------------------------

function ActivityTab({ creatorId }: { creatorId: string }) {
  const [items, setItems] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listCreatorActivity(creatorId)
      .then((result) => !cancelled && setItems(result))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load activity'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [creatorId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={44} rounded="lg" />)}
      </div>
    );
  }

  if (error) {
    return <div className="bg-danger-subtle border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger-text">{error}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <EmptyState icon={History} title="No activity yet" description="Actions taken on this creator will appear here." />
      </div>
    );
  }

  return (
    <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
      <ul className="divide-y divide-bg-border/40">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 px-4 py-3">
            <div className="w-7 h-7 rounded-lg bg-violet-600/15 text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
              <History size={13} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary">{item.message}</p>
              <p className="text-[11px] text-text-disabled mt-0.5">{item.actorName ?? 'System'} · {relativeTime(item.createdAt)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AuditTab({ creatorId }: { creatorId: string }) {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listCreatorAuditLog(creatorId)
      .then((result) => !cancelled && setItems(result))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load audit history'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [creatorId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={44} rounded="lg" />)}
      </div>
    );
  }

  if (error) {
    return <div className="bg-danger-subtle border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger-text">{error}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <EmptyState icon={ShieldCheck} title="No audit history yet" description="A tamper-evident record of changes to this creator will appear here." />
      </div>
    );
  }

  return (
    <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bg-border/40">
            {['Event', 'Actor', 'When'].map((col) => (
              <th key={col} className="text-left text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-bg-border/40">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">
                <Badge variant="violet" size="sm">{item.eventType}</Badge>
              </td>
              <td className="px-4 py-3 text-text-secondary">{item.userLabel ?? 'System'}</td>
              <td className="px-4 py-3 text-text-disabled text-xs">{relativeTime(item.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Main page --------------------------------------------------------

export default function CreatorDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { showToast } = useToast();
  const creatorId = params?.id;

  const [tab, setTab] = useState<Tab>('overview');
  const [ready, setReady] = useState(false);
  const [creator, setCreator] = useState<CreatorRecord | null>(null);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
    else setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready || !creatorId) return;
    setLoading(true);
    setLoadError(null);
    getCreator(creatorId)
      .then(setCreator)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load creator'))
      .finally(() => setLoading(false));
  }, [ready, creatorId]);

  useEffect(() => {
    if (!ready || !creatorId) return;
    setStatsLoading(true);
    getCreatorStats(creatorId)
      .then(setStats)
      .catch(() => undefined)
      .finally(() => setStatsLoading(false));
  }, [ready, creatorId, tab]);

  const handleArchiveOrRestore = useCallback(async () => {
    if (!creator) return;
    const nextStatus: CreatorStatus = creator.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED';
    setStatusBusy(true);
    try {
      const updated = await updateCreator(creator.id, { status: nextStatus });
      setCreator(updated);
      showToast(nextStatus === 'ARCHIVED' ? 'Creator archived' : 'Creator restored', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update creator status', 'error');
    } finally {
      setStatusBusy(false);
    }
  }, [creator, showToast]);

  const handleDelete = useCallback(async () => {
    if (!creator) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCreator(creator.id);
      showToast('Creator deleted', 'success');
      router.push('/creators');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete creator');
    } finally {
      setDeleting(false);
    }
  }, [creator, router, showToast]);

  const handleAvatarChanged = useCallback((mediaId: string | null) => {
    setCreator((prev) => (prev ? { ...prev, avatarUrl: mediaId } : prev));
  }, []);

  if (!ready || loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton height={20} width={120} rounded="sm" />
        <div className="flex items-center gap-4">
          <Skeleton width={48} height={48} rounded="full" />
          <div className="space-y-2">
            <Skeleton width={160} height={20} rounded="sm" />
            <Skeleton width={100} height={12} rounded="sm" />
          </div>
        </div>
        <Skeleton height={200} rounded="lg" />
      </div>
    );
  }

  if (loadError || !creator) {
    return (
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <EmptyState
          icon={Users}
          title="Creator not found"
          description={loadError ?? "This creator doesn't exist or has been removed."}
          action={{ label: 'Back to creators', href: '/creators' }}
          size="lg"
        />
      </div>
    );
  }

  const { variant, label } = STATUS_BADGE[creator.status];

  const TABS: { value: Tab; label: string }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'profile', label: 'Profile' },
    { value: 'media', label: 'Media' },
    { value: 'activity', label: 'Activity' },
    { value: 'audit', label: 'Audit' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <button
          type="button"
          onClick={() => router.push('/creators')}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft size={13} />
          All creators
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <CreatorAvatar name={creator.name} avatarUrl={creator.avatarUrl} size="xl" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-semibold text-text-primary">{creator.name}</h1>
                <Badge variant={variant} size="sm">{label}</Badge>
              </div>
              {creator.email && (
                <p className="text-sm text-text-muted mt-0.5 flex items-center gap-1">
                  <Mail size={11} className="shrink-0" />
                  {creator.email}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={creator.status === 'ARCHIVED' ? RotateCcw : Archive}
              loading={statusBusy}
              onClick={handleArchiveOrRestore}
            >
              {creator.status === 'ARCHIVED' ? 'Restore' : 'Archive'}
            </Button>
            <Button variant="danger" size="sm" icon={Trash2} onClick={() => setShowDeleteModal(true)}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-bg-border/40">
        {TABS.map(({ value, label: tabLabel }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={[
              'px-4 py-2 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px',
              tab === value ? 'border-violet-500 text-violet-400' : 'border-transparent text-text-muted hover:text-text-secondary',
            ].join(' ')}
          >
            {tabLabel}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab creator={creator} stats={stats} statsLoading={statsLoading} />}
      {tab === 'profile' && (
        <ProfileTab
          creator={creator}
          onSaved={setCreator}
          onArchiveOrRestore={handleArchiveOrRestore}
          onDelete={() => setShowDeleteModal(true)}
        />
      )}
      {tab === 'media' && (
        <MediaTab creatorId={creator.id} avatarUrl={creator.avatarUrl} onAvatarChanged={handleAvatarChanged} />
      )}
      {tab === 'activity' && <ActivityTab creatorId={creator.id} />}
      {tab === 'audit' && <AuditTab creatorId={creator.id} />}

      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete creator">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Delete <span className="font-medium text-text-primary">{creator.name}</span> permanently? Their media
            files will be kept in the workspace library but unlinked from this creator. This cannot be undone.
          </p>
          {deleteError && <p className="text-xs text-danger-text">{deleteError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>Delete permanently</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
