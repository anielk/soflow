'use client';

import { useEffect, useState } from 'react';
import { ImageIcon, Video } from 'lucide-react';
import { fetchMediaBlobUrl } from '@/lib/media';
import type { MediaItem } from '@/types/workspace';

interface MediaThumbnailProps {
  media: MediaItem;
  className?: string;
}

const MEDIA_COLOR: Record<'image' | 'video', string> = { image: '#3B82F6', video: '#7C3AED' };

export function MediaThumbnail({ media, className = '' }: MediaThumbnailProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!media.hasThumbnail) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    fetchMediaBlobUrl(media.id, 'thumbnail', 'small')
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setBlobUrl(url);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [media.id, media.hasThumbnail]);

  if (blobUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={blobUrl} alt={media.originalFilename} className={`object-cover ${className}`} />;
  }

  const color = MEDIA_COLOR[media.type];
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ background: `${color}14` }}>
      {media.type === 'video' ? (
        <Video size={28} style={{ color }} className="opacity-60" />
      ) : (
        <ImageIcon size={28} style={{ color }} className="opacity-60" />
      )}
    </div>
  );
}
