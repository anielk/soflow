'use client';

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { UploadCloud, X, RotateCcw, FileImage, FileVideo } from 'lucide-react';
import { uploadMedia } from '@/lib/media';
import type { MediaItem } from '@/types/workspace';

type TaskStatus = 'queued' | 'uploading' | 'success' | 'error' | 'canceled';

interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: TaskStatus;
  error?: string;
  controller: AbortController;
}

export interface UploadDropzoneHandle {
  openFileDialog: () => void;
}

interface UploadDropzoneProps {
  onUploaded: (media: MediaItem) => void;
}

const MAX_CONCURRENT_UPLOADS = 3;
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.mkv,.webm';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export const UploadDropzone = forwardRef<UploadDropzoneHandle, UploadDropzoneProps>(function UploadDropzone(
  { onUploaded },
  ref,
) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeCountRef = useRef(0);
  const queueRef = useRef<UploadTask[]>([]);

  useImperativeHandle(ref, () => ({
    openFileDialog: () => inputRef.current?.click(),
  }));

  const drainQueue = useCallback(() => {
    while (activeCountRef.current < MAX_CONCURRENT_UPLOADS && queueRef.current.length > 0) {
      const next = queueRef.current.shift();
      if (next) runTask(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runTask(task: UploadTask) {
    activeCountRef.current += 1;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'uploading', error: undefined, progress: 0 } : t)),
    );

    uploadMedia(task.file, {
      signal: task.controller.signal,
      onProgress: (percent) => {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, progress: percent } : t)));
      },
    })
      .then((media) => {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: 'success', progress: 100 } : t)));
        onUploaded(media);
      })
      .catch((err: unknown) => {
        const canceled = err instanceof DOMException && err.name === 'AbortError';
        const message = err instanceof Error ? err.message : 'Upload failed';
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, status: canceled ? 'canceled' : 'error', error: canceled ? undefined : message }
              : t,
          ),
        );
      })
      .finally(() => {
        activeCountRef.current -= 1;
        drainQueue();
      });
  }

  const enqueueFiles = useCallback(
    (files: FileList | File[]) => {
      const newTasks: UploadTask[] = Array.from(files).map((file) => ({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: 'queued',
        controller: new AbortController(),
      }));
      setTasks((prev) => [...prev, ...newTasks]);
      queueRef.current.push(...newTasks);
      drainQueue();
    },
    [drainQueue],
  );

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer.files?.length) enqueueFiles(event.dataTransfer.files);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) enqueueFiles(event.target.files);
    event.target.value = '';
  };

  const cancelTask = (task: UploadTask) => task.controller.abort();

  const retryTask = (task: UploadTask) => {
    const freshTask: UploadTask = {
      ...task,
      controller: new AbortController(),
      status: 'queued',
      progress: 0,
      error: undefined,
    };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? freshTask : t)));
    queueRef.current.push(freshTask);
    drainQueue();
  };

  const dismissTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors duration-150',
          dragOver ? 'border-violet-500 bg-violet-600/5' : 'border-bg-border hover:border-bg-muted',
        ].join(' ')}
      >
        <UploadCloud size={28} className="text-text-muted" />
        <p className="text-sm text-text-secondary">
          <span className="text-violet-400 font-medium">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-text-disabled">Images (jpg, png, webp, gif) or videos (mp4, mov, mkv, webm)</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {tasks.length > 0 && (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 bg-bg-surface border border-bg-border/60 rounded-lg px-3 py-2"
            >
              {task.file.type.startsWith('video') ? (
                <FileVideo size={16} className="text-violet-400 shrink-0" />
              ) : (
                <FileImage size={16} className="text-blue-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-text-primary truncate">{task.file.name}</p>
                  <span className="text-[10px] text-text-disabled shrink-0">{formatBytes(task.file.size)}</span>
                </div>
                {task.status === 'uploading' || task.status === 'queued' ? (
                  <div className="mt-1.5 h-1 bg-bg-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 transition-all duration-150"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                ) : task.status === 'error' ? (
                  <p className="mt-1 text-[11px] text-danger-text">{task.error}</p>
                ) : task.status === 'canceled' ? (
                  <p className="mt-1 text-[11px] text-text-muted">Canceled</p>
                ) : (
                  <p className="mt-1 text-[11px] text-success">Uploaded</p>
                )}
              </div>
              {(task.status === 'uploading' || task.status === 'queued') && (
                <button
                  type="button"
                  onClick={() => cancelTask(task)}
                  className="text-text-muted hover:text-danger-text transition-colors duration-150"
                  aria-label="Cancel upload"
                >
                  <X size={14} />
                </button>
              )}
              {(task.status === 'error' || task.status === 'canceled') && (
                <button
                  type="button"
                  onClick={() => retryTask(task)}
                  className="text-text-muted hover:text-violet-400 transition-colors duration-150"
                  aria-label="Retry upload"
                >
                  <RotateCcw size={14} />
                </button>
              )}
              {task.status !== 'uploading' && task.status !== 'queued' && (
                <button
                  type="button"
                  onClick={() => dismissTask(task.id)}
                  className="text-text-muted hover:text-text-primary transition-colors duration-150"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
