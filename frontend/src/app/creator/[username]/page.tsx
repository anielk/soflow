'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { Avatar } from '@/components/ui';
import { Layers, Globe, ExternalLink } from 'lucide-react';

interface Creator {
  name?:    string;
  email:    string;
  bio?:     string;
  avatarUrl?: string;
  website?: string;
  creatorProfile?: {
    socialLinks?: Record<string, string>;
  };
}

export default function PublicCreatorPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    apiGet<Creator>(`/creators/${username}`)
      .then((data) => { setCreator(data); setLoading(false); })
      .catch(() => { setError('Creator not found'); setLoading(false); });
  }, [username]);

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Minimal branded topbar */}
      <header className="border-b border-bg-border bg-bg-surface">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-violet-600 flex items-center justify-center">
              <Layers size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-text-primary">Soflow</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading && (
          <div className="text-center text-text-muted py-20 text-sm">Loading profile…</div>
        )}

        {error && (
          <div className="text-center text-danger-text py-20 text-sm">{error}</div>
        )}

        {creator && !loading && (
          <div className="bg-bg-surface border border-bg-border rounded-xl p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-5">
              {creator.avatarUrl ? (
                <Image
                  src={creator.avatarUrl}
                  alt={creator.name ?? creator.email}
                  width={72}
                  height={72}
                  className="rounded-full object-cover"
                />
              ) : (
                <Avatar name={creator.name ?? creator.email} size="xl" />
              )}
              <div>
                <h1 className="text-xl font-semibold text-text-primary">
                  {creator.name ?? creator.email.split('@')[0]}
                </h1>
                <p className="text-sm text-text-muted mt-0.5">{creator.email}</p>
              </div>
            </div>

            {creator.bio && (
              <div>
                <h2 className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Bio</h2>
                <p className="text-sm text-text-secondary leading-relaxed">{creator.bio}</p>
              </div>
            )}

            {creator.website && (
              <div>
                <h2 className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Website</h2>
                <a
                  href={creator.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <Globe size={13} />
                  {creator.website}
                  <ExternalLink size={11} className="text-text-muted" />
                </a>
              </div>
            )}

            {creator.creatorProfile?.socialLinks &&
              Object.keys(creator.creatorProfile.socialLinks).length > 0 && (
                <div>
                  <h2 className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Social</h2>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(creator.creatorProfile.socialLinks).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={String(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-subtle border border-bg-border text-xs text-text-secondary hover:text-text-primary hover:border-bg-muted transition-colors"
                      >
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        <ExternalLink size={10} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </main>
    </div>
  );
}
