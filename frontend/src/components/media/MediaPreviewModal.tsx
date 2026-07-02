'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui';
import { fetchMediaBlobUrl } from '@/lib/media';
import type { MediaItem } from '@/types/workspace';

interface MediaPreviewModalProps {
  media: MediaItem | null;
  onClose: () => void;
}

export function MediaPreviewModal({ media, onClose }: MediaPreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!media) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    setBlobUrl(null);
    setError(null);

    fetchMediaBlobUrl(media.id, 'file')
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setBlobUrl(url);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load preview');
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [media]);

  return (
    <Modal open={Boolean(media)} onClose={onClose} title={media?.originalFilename} maxWidth="max-w-3xl">
      <div className="flex items-center justify-center min-h-[240px]">
        {error ? (
          <p className="text-sm text-danger-text">{error}</p>
        ) : !blobUrl ? (
          <Loader2 size={24} className="animate-spin text-text-muted" />
        ) : media?.type === 'video' ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={blobUrl} controls autoPlay className="max-h-[70vh] w-full rounded-lg bg-black" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={blobUrl} alt={media?.originalFilename} className="max-h-[70vh] w-full object-contain rounded-lg" />
        )}
      </div>
    </Modal>
  );
}
