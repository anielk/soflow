'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Badge, Button } from '@/components/ui';
import { FilePlus, Eye, TrendingUp, CalendarClock, Users, Heart, MessageCircle, ImageIcon, Video } from 'lucide-react';
import { formatCurrency, formatNumber, relativeTime, timeUntil } from '@/lib/format';
import type { Post, MediaType } from '@/types/workspace';

const TODAY_STATS = [
  { label: 'Views today',      value: 2847,   format: 'number',   color: '#8B5CF6', icon: Eye           },
  { label: 'Earnings today',   value: 342.50, format: 'currency', color: '#10B981', icon: TrendingUp    },
  { label: 'Scheduled today',  value: 2,      format: 'number',   color: '#3B82F6', icon: CalendarClock },
  { label: 'New subscribers',  value: 14,     format: 'number',   color: '#EC4899', icon: Users         },
] as const;

const MOCK_POSTS: Post[] = [
  {
    id: '1', title: 'Morning workout routine',
    caption: 'Starting the day right! Full upper body workout.',
    type: 'free', status: 'published', publishedAt: '2026-06-27T07:00:00Z',
    likes: 247, views: 1840, comments: 18, earnings: 0, mediaCount: 3, mediaType: 'video',
  },
  {
    id: '2', title: 'BTS beach photoshoot',
    caption: "Behind the scenes from last weekend's shoot.",
    type: 'ppv', status: 'published', price: 15, publishedAt: '2026-06-26T14:00:00Z',
    likes: 183, views: 640, comments: 24, earnings: 2145, mediaCount: 12, mediaType: 'image',
  },
  {
    id: '3', title: 'Q&A highlights — June',
    caption: 'Answering your top questions from this month.',
    type: 'free', status: 'published', publishedAt: '2026-06-25T18:00:00Z',
    likes: 312, views: 2210, comments: 47, earnings: 0, mediaCount: 1, mediaType: 'video',
  },
  {
    id: '4', title: 'Cooking with me 🍝',
    caption: 'Making my favourite pasta recipe.',
    type: 'free', status: 'scheduled', scheduledAt: '2026-06-28T16:00:00Z',
    likes: 0, views: 0, comments: 0, earnings: 0, mediaCount: 2, mediaType: 'video',
  },
  {
    id: '5', title: 'Evening yoga session',
    caption: 'Wind down with a 30-minute yoga flow.',
    type: 'free', status: 'scheduled', scheduledAt: '2026-06-28T20:00:00Z',
    likes: 0, views: 0, comments: 0, earnings: 0, mediaCount: 1, mediaType: 'video',
  },
  {
    id: '6', title: 'Studio shoot — new outfits',
    caption: '',
    type: 'ppv', status: 'scheduled', price: 20, scheduledAt: '2026-06-29T12:00:00Z',
    likes: 0, views: 0, comments: 0, earnings: 0, mediaCount: 18, mediaType: 'image',
  },
];

const MEDIA_COLOR: Record<MediaType, string> = { video: '#7C3AED', image: '#3B82F6' };

const published = MOCK_POSTS.filter((p) => p.status === 'published');
const scheduled = MOCK_POSTS.filter((p) => p.status === 'scheduled');

export default function OFManagerHomePage() {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Creator Manager</h1>
          <p className="mt-1 text-sm text-text-muted">Saturday, 28 June 2026</p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={FilePlus}
          onClick={() => router.push('/creator-manager/new-post')}
        >
          New post
        </Button>
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {TODAY_STATS.map(({ label, value, format, color, icon: Icon }) => (
          <div
            key={label}
            className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 flex items-center gap-3"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${color}18` }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-disabled">
                {label}
              </p>
              <p className="mt-0.5 text-lg font-bold text-text-primary tabular-nums leading-none">
                {format === 'currency' ? formatCurrency(value) : formatNumber(value)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent posts (2/3 width) */}
        <div className="xl:col-span-2 bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-bg-border/40">
            <h3 className="text-sm font-semibold text-text-primary">Recent posts</h3>
            <button
              type="button"
              className="text-[11px] font-medium text-text-disabled hover:text-violet-400 transition-colors duration-150 px-2 py-0.5 rounded hover:bg-violet-600/10"
              onClick={() => router.push('/creator-manager/queue')}
            >
              View all
            </button>
          </div>

          <ul className="divide-y divide-bg-border/40">
            {published.map((post) => {
              const color = MEDIA_COLOR[post.mediaType];
              return (
                <li
                  key={post.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-bg-subtle/40 transition-colors duration-100"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${color}18` }}
                  >
                    {post.mediaType === 'video'
                      ? <Video size={15} style={{ color }} />
                      : <ImageIcon size={15} style={{ color }} />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-primary truncate">{post.title}</p>
                      {post.type === 'ppv' && post.price != null && (
                        <Badge variant="violet" size="sm">€{post.price}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-[11px] text-text-muted">
                        <Heart size={10} /> {formatNumber(post.likes)}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-text-muted">
                        <Eye size={10} /> {formatNumber(post.views)}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-text-muted">
                        <MessageCircle size={10} /> {post.comments}
                      </span>
                      {post.publishedAt && (
                        <span className="text-[11px] text-text-disabled">
                          {relativeTime(post.publishedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {post.earnings > 0 && (
                    <span className="text-sm font-semibold text-success-text tabular-nums shrink-0">
                      {formatCurrency(post.earnings)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Up next (1/3 width) */}
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-bg-border/40">
            <h3 className="text-sm font-semibold text-text-primary">Up next</h3>
            <button
              type="button"
              className="text-[11px] font-medium text-text-disabled hover:text-violet-400 transition-colors duration-150 px-2 py-0.5 rounded hover:bg-violet-600/10"
              onClick={() => router.push('/creator-manager/queue')}
            >
              View queue
            </button>
          </div>

          <ul className="divide-y divide-bg-border/40">
            {scheduled.map((post) => (
              <li
                key={post.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-bg-subtle/40 transition-colors duration-100"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{post.title}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {post.scheduledAt ? timeUntil(post.scheduledAt) : '—'}
                  </p>
                </div>
                {post.type === 'ppv' && post.price != null
                  ? <Badge variant="violet" size="sm">€{post.price}</Badge>
                  : <Badge variant="success" size="sm">Free</Badge>
                }
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
