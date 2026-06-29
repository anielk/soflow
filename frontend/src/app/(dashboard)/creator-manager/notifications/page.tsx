'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Avatar, Badge, Button } from '@/components/ui';
import { Heart, DollarSign, Users, MessageCircle, RefreshCw, ShoppingBag, BellOff } from 'lucide-react';
import { formatCurrency, relativeTime } from '@/lib/format';
import type { Notification, NotifType } from '@/types/workspace';

const NOTIF_ICONS: Record<NotifType, { icon: typeof Heart; color: string; label: string }> = {
  like:         { icon: Heart,         color: '#EC4899', label: 'liked your post' },
  tip:          { icon: DollarSign,    color: '#10B981', label: 'sent a tip' },
  subscription: { icon: Users,         color: '#8B5CF6', label: 'subscribed' },
  renewal:      { icon: RefreshCw,     color: '#8B5CF6', label: 'renewed' },
  comment:      { icon: MessageCircle, color: '#3B82F6', label: 'commented' },
  ppv_unlock:   { icon: ShoppingBag,   color: '#F59E0B', label: 'unlocked a post' },
};

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1',  type: 'tip',          fanName: 'Jake Davis',     content: '"Morning workout routine"', amount: 25,  timestamp: '2026-06-28T12:34:00Z', read: false },
  { id: '2',  type: 'subscription', fanName: 'Mike Rodriguez', content: 'Monthly — €9.99',           amount: 10,  timestamp: '2026-06-28T12:22:00Z', read: false },
  { id: '3',  type: 'like',         fanName: 'Chris Anderson', content: '"BTS beach photoshoot"',                 timestamp: '2026-06-28T11:45:00Z', read: false },
  { id: '4',  type: 'ppv_unlock',   fanName: 'Tom Baker',      content: '"BTS beach photoshoot"',    amount: 15,  timestamp: '2026-06-28T10:30:00Z', read: true  },
  { id: '5',  type: 'comment',      fanName: 'Dan Kim',        content: '"Amazing content as always 🔥"',         timestamp: '2026-06-28T09:15:00Z', read: true  },
  { id: '6',  type: 'renewal',      fanName: 'Sarah Wilson',   content: 'Monthly — €9.99',           amount: 10,  timestamp: '2026-06-28T08:00:00Z', read: true  },
  { id: '7',  type: 'tip',          fanName: 'Alex Turner',    content: '"Q&A highlights — June"',   amount: 50,  timestamp: '2026-06-27T22:30:00Z', read: true  },
  { id: '8',  type: 'like',         fanName: 'Ryan Clark',     content: '"Morning workout routine"',              timestamp: '2026-06-27T21:00:00Z', read: true  },
  { id: '9',  type: 'comment',      fanName: 'Emma White',     content: '"Can you do more of these?"',            timestamp: '2026-06-27T18:45:00Z', read: true  },
  { id: '10', type: 'subscription', fanName: 'James Moore',    content: 'Monthly — €9.99',           amount: 10,  timestamp: '2026-06-27T15:00:00Z', read: true  },
];

type FilterTab = 'all' | NotifType;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all',          label: 'All' },
  { value: 'tip',          label: 'Tips' },
  { value: 'subscription', label: 'Subscriptions' },
  { value: 'like',         label: 'Likes' },
  { value: 'comment',      label: 'Comments' },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [activeTab,     setActiveTab]     = useState<FilterTab>('all');

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const filtered = activeTab === 'all'
    ? notifications
    : notifications.filter((n) => n.type === activeTab);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-text-primary">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="violet" size="sm">{unreadCount} new</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-text-muted">Fan activity across all your posts.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Card */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-3 py-2.5 border-b border-bg-border/40">
          {FILTER_TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className={[
                'px-3 py-1 rounded text-xs font-medium transition-colors duration-150',
                activeTab === value
                  ? 'bg-violet-600/15 text-violet-400'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-subtle',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Notification list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 rounded-xl bg-bg-subtle flex items-center justify-center">
              <BellOff size={18} className="text-text-muted" />
            </div>
            <p className="text-sm text-text-muted">No notifications</p>
          </div>
        ) : (
          <ul className="divide-y divide-bg-border/40">
            {filtered.map((notif) => {
              const cfg  = NOTIF_ICONS[notif.type];
              const Icon = cfg.icon;
              return (
                <li
                  key={notif.id}
                  className={[
                    'flex items-start gap-3 px-4 py-3.5 hover:bg-bg-subtle/40 transition-colors duration-100',
                    !notif.read ? 'bg-violet-600/[0.03]' : '',
                  ].join(' ')}
                >
                  {/* Unread dot */}
                  <div className="mt-1.5 w-2 h-2 shrink-0">
                    {!notif.read && (
                      <span className="block w-2 h-2 rounded-full bg-violet-500" />
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar name={notif.fanName} size="sm" />

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      <span className="font-semibold text-text-primary">{notif.fanName}</span>
                      {' '}
                      <span className="text-text-muted">{cfg.label}</span>
                      {notif.content && (
                        <span className="text-text-muted"> {notif.content}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Icon size={10} style={{ color: cfg.color }} />
                      <span className="text-[11px] text-text-disabled">{relativeTime(notif.timestamp)}</span>
                    </div>
                  </div>

                  {/* Amount */}
                  {notif.amount != null && (
                    <span
                      className="text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        color:           cfg.color,
                        backgroundColor: `${cfg.color}18`,
                      }}
                    >
                      {formatCurrency(notif.amount)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
