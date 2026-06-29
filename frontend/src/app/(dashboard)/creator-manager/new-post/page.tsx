'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Button, Input, Textarea } from '@/components/ui';
import { Upload, X, ImageIcon, Video } from 'lucide-react';

type PostType     = 'free' | 'ppv';
type ScheduleMode = 'now' | 'later';

export default function NewPostPage() {
  const router = useRouter();

  const [postType,     setPostType]     = useState<PostType>('free');
  const [price,        setPrice]        = useState('');
  const [caption,      setCaption]      = useState('');
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('now');
  const [schedDate,    setSchedDate]    = useState('');
  const [schedTime,    setSchedTime]    = useState('');
  const [mediaFiles,   setMediaFiles]   = useState<{ name: string; type: 'image' | 'video' }[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).map((f) => ({
      name: f.name,
      type: (f.type.startsWith('video') ? 'video' : 'image') as 'image' | 'video',
    }));
    setMediaFiles((prev) => [...prev, ...files]);
  }

  function removeMedia(index: number) {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: POST /v1/posts { type: postType, price, caption, scheduledAt, mediaIds }
    router.push('/creator-manager/queue');
  }

  const isValid = caption.trim().length > 0 || mediaFiles.length > 0;

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">New post</h1>
          <p className="mt-1 text-sm text-text-muted">Create and schedule content for your creator.</p>
        </div>
        <Button variant="ghost" size="md" icon={X} onClick={() => router.back()}>
          Discard
        </Button>
      </div>

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
                hint="Fans pay this amount to unlock the post."
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
            {/* Drop zone */}
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
                  Drag & drop or click to upload · JPG, PNG, MP4, MOV
                </p>
              </div>
              <span className="text-xs text-text-disabled">Max 2 GB per file</span>
            </div>

            {/* Uploaded file list */}
            {mediaFiles.length > 0 && (
              <ul className="space-y-1.5">
                {mediaFiles.map((file, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2.5 px-3 py-2 bg-bg-subtle rounded-lg"
                  >
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-bg-overlay shrink-0">
                      {file.type === 'video'
                        ? <Video size={12} className="text-violet-400" />
                        : <ImageIcon size={12} className="text-blue-400" />
                      }
                    </div>
                    <span className="flex-1 text-xs text-text-primary truncate">{file.name}</span>
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
                { value: 'now',   label: 'Post now' },
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
        <div className="flex items-center justify-between gap-4 pt-2">
          <Button type="button" variant="secondary" size="md" onClick={() => router.back()}>
            Save as draft
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!isValid}
          >
            {scheduleMode === 'now' ? 'Post now' : 'Schedule post'}
          </Button>
        </div>
      </form>
    </div>
  );
}
