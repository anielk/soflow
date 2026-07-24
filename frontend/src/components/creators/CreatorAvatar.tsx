'use client';

import { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui';
import { fetchMediaBlobUrl } from '@/lib/media';

interface CreatorAvatarProps {
  name: string;
  /** The creator's `avatarUrl` field — actually a Media ID from that creator's own library, not a URL. */
  avatarUrl: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function CreatorAvatar({ name, avatarUrl, size = 'md' }: CreatorAvatarProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarUrl) {
      setBlobUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;

    fetchMediaBlobUrl(avatarUrl, 'thumbnail', 'small')
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setBlobUrl(url);
      })
      .catch(() => setBlobUrl(null));

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [avatarUrl]);

  return <Avatar name={name} src={blobUrl} size={size} />;
}
