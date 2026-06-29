'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Badge, Button } from '@/components/ui';
import { ExternalLink, CheckCircle2, Clock } from 'lucide-react';

interface Platform {
  id:          string;
  name:        string;
  category:    'creator' | 'social' | 'streaming';
  description: string;
  logoLetter:  string;
  logoColor:   string;
  status:      'available' | 'coming_soon';
}

const PLATFORMS: Platform[] = [
  {
    id: 'onlyfans', name: 'OnlyFans', category: 'creator',
    description: 'Connect OnlyFans creator accounts to manage posts, messages, fans, and revenue from Leinaflow.',
    logoLetter: 'O', logoColor: '#00AFF0', status: 'available',
  },
  {
    id: 'fansly', name: 'Fansly', category: 'creator',
    description: 'Manage Fansly accounts alongside other creator platforms in a unified workspace.',
    logoLetter: 'F', logoColor: '#2CD4C3', status: 'coming_soon',
  },
  {
    id: 'patreon', name: 'Patreon', category: 'creator',
    description: 'Sync Patreon memberships, posts, and patron communications.',
    logoLetter: 'P', logoColor: '#FF424D', status: 'coming_soon',
  },
  {
    id: 'fanvue', name: 'Fanvue', category: 'creator',
    description: 'Connect Fanvue to manage subscriptions, content, and fan messaging.',
    logoLetter: 'FV', logoColor: '#7C3AED', status: 'coming_soon',
  },
  {
    id: 'instagram', name: 'Instagram', category: 'social',
    description: 'Track growth, schedule posts, and monitor engagement across Instagram profiles.',
    logoLetter: 'IG', logoColor: '#E1306C', status: 'coming_soon',
  },
  {
    id: 'tiktok', name: 'TikTok', category: 'social',
    description: 'Monitor TikTok analytics and cross-post content from the Leinaflow dashboard.',
    logoLetter: 'TT', logoColor: '#010101', status: 'coming_soon',
  },
  {
    id: 'x', name: 'X (Twitter)', category: 'social',
    description: 'Schedule posts and track follower growth across X creator accounts.',
    logoLetter: 'X', logoColor: '#1D9BF0', status: 'coming_soon',
  },
  {
    id: 'youtube', name: 'YouTube', category: 'streaming',
    description: 'Connect YouTube channels to track views, subscribers, and revenue.',
    logoLetter: 'YT', logoColor: '#FF0000', status: 'coming_soon',
  },
  {
    id: 'twitch', name: 'Twitch', category: 'streaming',
    description: 'Monitor stream performance, subscribers, and channel points across creators.',
    logoLetter: 'Tw', logoColor: '#9146FF', status: 'coming_soon',
  },
];

const CATEGORY_LABELS: Record<Platform['category'], string> = {
  creator:   'Creator platforms',
  social:    'Social media',
  streaming: 'Streaming',
};

function groupByCategory(platforms: Platform[]) {
  const groups: Record<string, Platform[]> = {};
  for (const p of platforms) {
    if (!groups[p.category]) groups[p.category] = [];
    groups[p.category].push(p);
  }
  return groups;
}

export default function PlatformsPage() {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  const groups = groupByCategory(PLATFORMS);
  const categoryOrder: Platform['category'][] = ['creator', 'social', 'streaming'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
          <span
            className="hover:text-text-secondary cursor-pointer"
            onClick={() => router.push('/settings')}
          >
            Settings
          </span>
          <span>/</span>
          <span className="text-text-secondary">Connected Platforms</span>
        </div>
        <h1 className="text-xl font-semibold text-text-primary">Connected Platforms</h1>
        <p className="mt-1 text-sm text-text-muted">
          Connect creator platforms and social accounts to manage everything from one place.
        </p>
      </div>

      {/* Platform groups */}
      {categoryOrder.map((category) => {
        const items = groups[category];
        if (!items?.length) return null;
        return (
          <div key={category}>
            <h2 className="text-xs font-semibold text-text-disabled uppercase tracking-[0.06em] mb-3">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {items.map((platform) => (
                <div
                  key={platform.id}
                  className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 flex items-start gap-4"
                >
                  {/* Logo */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold"
                    style={{ backgroundColor: platform.logoColor }}
                  >
                    {platform.logoLetter}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-text-primary">{platform.name}</p>
                      {platform.status === 'available' && (
                        <Badge variant="success" size="sm">
                          <CheckCircle2 size={10} className="mr-1" /> Available
                        </Badge>
                      )}
                      {platform.status === 'coming_soon' && (
                        <Badge variant="default" size="sm">
                          <Clock size={10} className="mr-1" /> Coming soon
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">
                      {platform.description}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="shrink-0">
                    {platform.status === 'available' ? (
                      <Button variant="secondary" size="sm" className="gap-1.5">
                        Connect <ExternalLink size={11} />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" disabled>
                        Notify me
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Info callout */}
      <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-4">
        <p className="text-sm font-semibold text-violet-300 mb-1">Architecture</p>
        <p className="text-xs text-text-muted leading-relaxed">
          Leinaflow is built as a platform-agnostic creator OS. Each connector is an independent
          integration — adding a new platform never changes how existing ones work. OnlyFans is
          available now; additional connectors will be released progressively.
        </p>
      </div>
    </div>
  );
}
