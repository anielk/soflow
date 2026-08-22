'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Button, Input, Textarea } from '@/components/ui';
import { Upload, X, ImageIcon, Video, Loader2 } from 'lucide-react';
import { createPost, getPost, updatePost } from '@/lib/posts';
import { uploadMedia } from '@/lib/media';
import type { PostType } from '@/types/workspace';

type ScheduleMode = 'now' | 'later';

interface PendingFile {
  file: File;
  name: string;
  type: 'image' | 'video';
}

/**
 * Local YYYY-MM-DD for a native <input type="date"> value. Must be built
 * from local calendar components (getFullYear/getMonth/getDate) — not
 * toISOString(), which is UTC and silently shifts the displayed date by a
 * day for anyone whose local offset crosses midnight relative to UTC.
 */
function toLocalDateValue(d: Date): string {
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Local HH:mm for a native <input type="time"> value. The DOM requires
 * exactly this zero-padded 24-hour format regardless of how the browser
 * chooses to *display* it (e.g. locale-formatted with AM/PM) — handing it
 * anything else (including a UTC time when the viewer isn't in UTC) can
 * desync what's shown from what's actually stored, and a malformed string
 * here is what makes the browser reject the field as "Invalid value". Built
 * from local calendar components for the same reason as toLocalDateValue.
 */
function toLocalTimeValue(d: Date): string {
  const hours   = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Combines a <input type="date"> value and a <input type="time"> value —
 * both always local, zero-padded, 24-hour strings per the HTML spec — into
 * the Date they represent. Parses each field explicitly rather than
 * concatenating them into a string for `new Date(...)`, so the result never
 * depends on a JS engine's string-parsing behavior. Returns null if either
 * field isn't in the exact format the native inputs are supposed to emit.
 */
function combineLocalDateAndTime(dateValue: string, timeValue: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue);
  if (!dateMatch || !timeMatch) return null;

  const [, year, month, day] = dateMatch;
  const [, hours, minutes] = timeMatch;
  const combined = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), 0, 0);
  return Number.isNaN(combined.getTime()) ? null : combined;
}

export default function NewPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get('id');

  const [postType,     setPostType]     = useState<PostType>('free');
  const [price,        setPrice]        = useState('');
  const [caption,      setCaption]      = useState('');
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('now');
  const [schedDate,    setSchedDate]    = useState('');
  const [schedTime,    setSchedTime]    = useState('');
  const [mediaFiles,   setMediaFiles]   = useState<PendingFile[]>([]);
  const [existingMediaIds, setExistingMediaIds] = useState<string[]>([]);

  const [loading,      setLoading]      = useState(Boolean(editingId));
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  useEffect(() => {
    if (!editingId) return;
    getPost(editingId)
      .then((post) => {
        setCaption(post.caption);
        setPostType(post.type);
        setPrice(post.price != null ? String(post.price) : '');
        setExistingMediaIds(post.mediaIds);
        if (post.scheduledAt) {
          const d = new Date(post.scheduledAt);
          setScheduleMode('later');
          setSchedDate(toLocalDateValue(d));
          setSchedTime(toLocalTimeValue(d));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load post'))
      .finally(() => setLoading(false));
  }, [editingId]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).map((file) => ({
      file,
      name: file.name,
      type: (file.type.startsWith('video') ? 'video' : 'image') as 'image' | 'video',
    }));
    setMediaFiles((prev) => [...prev, ...files]);
  }

  function removeMedia(index: number) {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    let scheduledAt: string | undefined;
    if (scheduleMode === 'later') {
      if (!schedDate || !schedTime) {
        setError('Pick a date and time to schedule this post, or switch to "Save now".');
        return;
      }
      const combined = combineLocalDateAndTime(schedDate, schedTime);
      if (!combined) {
        setError('That date/time is not valid. Please re-select the date and time.');
        return;
      }
      if (combined.getTime() <= Date.now()) {
        setError('Pick a date and time in the future to schedule this post.');
        return;
      }
      scheduledAt = combined.toISOString();
    }

    setSubmitting(true);
    try {
      const uploadedIds = await Promise.all(mediaFiles.map((pf) => uploadMedia(pf.file).then((m) => m.id)));
      const mediaIds = [...existingMediaIds, ...uploadedIds];

      const input = {
        caption: caption || undefined,
        type: postType,
        price: postType === 'ppv' && price ? Number(price) : undefined,
        scheduledAt,
        mediaIds,
      };

      if (editingId) {
        await updatePost(editingId, input);
      } else {
        await createPost(input);
      }
      router.push('/creator-manager/queue');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl flex items-center justify-center py-24">
        <Loader2 size={20} className="animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{editingId ? 'Edit post' : 'New post'}</h1>
          <p className="mt-1 text-sm text-text-muted">
            {editingId ? 'Update this draft or scheduled post.' : 'Draft or schedule content for your creator.'}
          </p>
        </div>
        <Button variant="ghost" size="md" icon={X} onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      {error && (
        <div className="bg-danger-subtle border border-danger-text/20 text-danger-text text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Post type */}
        <section>
          <h2 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] mb-3">
            Post type
          </h2>
          <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 space-y-4">
            <div className="flex rounded-lg border border-bg-border overflow-hidden">
              {(['free', 'ppv'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPostType(t)}
                  className={[
                    'flex-1 py-2 text-sm font-medium transition-colors duration-150',
                    postType === t
                      ? 'bg-violet-600 text-white'
                      : 'bg-bg-subtle text-text-secondary hover:bg-bg-overlay',
                  ].join(' ')}
                >
                  {t === 'free' ? 'Free post' : 'Pay per view'}
                </button>
              ))}
            </div>

            {postType === 'ppv' && (
              <Input
                label="Price (€)"
                type="number"
                min="1"
                max="200"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 15"
                hint="Stored with the post — there is no payment processing behind this yet."
              />
            )}
          </div>
        </section>

        {/* Media */}
        <section>
          <h2 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] mb-3">
            Media
          </h2>
          <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 space-y-3">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-bg-border/60 rounded-xl flex flex-col items-center justify-center py-10 px-6 text-center gap-3 bg-bg-subtle/30 cursor-pointer hover:border-violet-600/50 hover:bg-violet-600/[0.04] transition-colors duration-150"
            >
              <div className="w-10 h-10 rounded-xl bg-bg-overlay flex items-center justify-center">
                <Upload size={18} className="text-text-muted" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Upload media</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Drag & drop · uploaded to your Media Library and attached to this post
                </p>
              </div>
              <span className="text-xs text-text-disabled">Max 2 GB per file</span>
            </div>

            {existingMediaIds.length > 0 && (
              <p className="text-xs text-text-muted">{existingMediaIds.length} file(s) already attached.</p>
            )}

            {mediaFiles.length > 0 && (
              <ul className="space-y-1.5">
                {mediaFiles.map((pf, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2.5 px-3 py-2 bg-bg-subtle rounded-lg"
                  >
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-bg-overlay shrink-0">
                      {pf.type === 'video'
                        ? <Video size={12} className="text-violet-400" />
                        : <ImageIcon size={12} className="text-blue-400" />
                      }
                    </div>
                    <span className="flex-1 text-xs text-text-primary truncate">{pf.name}</span>
                    <button
                      type="button"
                      onClick={() => removeMedia(i)}
                      className="text-text-muted hover:text-text-primary transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Caption */}
        <section>
          <h2 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] mb-3">
            Caption
          </h2>
          <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5">
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 1000))}
              rows={5}
              placeholder="Write your caption…"
            />
            <div className="flex justify-end mt-1.5">
              <span className="text-[11px] text-text-disabled">{caption.length} / 1000</span>
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section>
          <h2 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] mb-3">
            Schedule
          </h2>
          <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 space-y-3">
            <div className="flex flex-col gap-2.5">
              {([
                { value: 'now',   label: 'Save now (draft)' },
                { value: 'later', label: 'Schedule for later' },
              ] as const).map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="schedule"
                    checked={scheduleMode === value}
                    onChange={() => setScheduleMode(value)}
                    className="accent-violet-600 w-4 h-4"
                  />
                  <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                    {label}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-text-muted">
              There is no integration with any platform yet, so nothing is actually distributed — this only saves
              the post and, if scheduled, its date/time to your Publishing Queue.
            </p>

            {scheduleMode === 'later' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Input
                  label="Date"
                  type="date"
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                />
                <Input
                  label="Time"
                  type="time"
                  value={schedTime}
                  onChange={(e) => setSchedTime(e.target.value)}
                />
              </div>
            )}
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={submitting}
            loading={submitting}
          >
            {submitting
              ? 'Saving…'
              : scheduleMode === 'now'
                ? (editingId ? 'Save changes' : 'Save draft')
                : (editingId ? 'Save schedule' : 'Schedule post')}
          </Button>
        </div>
      </form>
    </div>
  );
}
