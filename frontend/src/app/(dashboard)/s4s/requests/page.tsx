'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Badge, Button } from '@/components/ui';
import { CheckCircle2, XCircle, Users, Clock } from 'lucide-react';
import { formatNumber, relativeTime } from '@/lib/format';

type S4SStatus    = 'pending' | 'accepted' | 'declined' | 'completed';
type S4SDirection = 'incoming' | 'outgoing';

interface S4SRequest {
  id:            string;
  creatorName:   string;
  username:      string;
  category:      string;
  fans:          number;
  message:       string;
  status:        S4SStatus;
  direction:     S4SDirection;
  requestedAt:   string;
}

const MOCK_REQUESTS: S4SRequest[] = [
  { id: 'r1', creatorName: 'FitByNature',    username: 'fitbynature',    category: 'Fitness',       fans: 8400,  message: 'Hey! Love your content. Would love to do an S4S — I think our audiences overlap well!', status: 'pending',   direction: 'incoming', requestedAt: '2026-06-26T14:00:00Z' },
  { id: 'r2', creatorName: 'TravelWithLuna', username: 'travelwithluna', category: 'Travel',        fans: 12300, message: 'Interested in a mutual shoutout? My fans love lifestyle content.',                       status: 'accepted',  direction: 'outgoing', requestedAt: '2026-06-24T10:00:00Z' },
  { id: 'r3', creatorName: 'ChefMark',       username: 'chefmark',       category: 'Lifestyle',     fans: 3200,  message: 'Would be happy to do an S4S with you! Big fan of your work.',                          status: 'declined',  direction: 'incoming', requestedAt: '2026-06-20T08:00:00Z' },
  { id: 'r4', creatorName: 'YogaWithSarah',  username: 'yogawithsarah',  category: 'Wellness',      fans: 9100,  message: 'We did a collab last month — want to do another one this month?',                      status: 'completed', direction: 'incoming', requestedAt: '2026-06-15T12:00:00Z' },
  { id: 'r5', creatorName: 'DanceByAlex',    username: 'dancebyalex',    category: 'Entertainment', fans: 5800,  message: 'Reaching out for a potential S4S partnership.',                                        status: 'pending',   direction: 'outgoing', requestedAt: '2026-06-28T09:00:00Z' },
];

const STATUS_CONFIG: Record<S4SStatus, { variant: 'success' | 'warning' | 'danger' | 'default'; label: string }> = {
  pending:   { variant: 'warning', label: 'Pending'   },
  accepted:  { variant: 'success', label: 'Accepted'  },
  declined:  { variant: 'danger',  label: 'Declined'  },
  completed: { variant: 'default', label: 'Completed' },
};

export default function S4SRequestsPage() {
  const router = useRouter();
  const [tab,      setTab]      = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [requests, setRequests] = useState(MOCK_REQUESTS);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  function respond(id: string, action: 'accepted' | 'declined') {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: action } : r));
  }

  const filtered = requests.filter((r) => tab === 'all' || r.direction === tab);

  const pendingIncoming = requests.filter((r) => r.direction === 'incoming' && r.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Requests</h1>
        <p className="mt-1 text-sm text-text-muted">Manage incoming and outgoing share-for-share requests</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending incoming', value: String(pendingIncoming),                                    icon: Clock,        color: '#F59E0B' },
          { label: 'Active S4S',       value: String(requests.filter((r) => r.status === 'accepted').length), icon: Users,   color: '#10B981' },
          { label: 'Completed',        value: String(requests.filter((r) => r.status === 'completed').length), icon: CheckCircle2, color: '#3B82F6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-disabled">{label}</p>
              <p className="mt-0.5 text-base font-bold text-text-primary tabular-nums leading-none">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab filter */}
      <div className="flex items-center gap-1">
        {(['all', 'incoming', 'outgoing'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              'px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors duration-150',
              tab === t
                ? 'bg-violet-600/15 text-violet-400'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-subtle border border-bg-border/60',
            ].join(' ')}
          >
            {t === 'all' ? `All (${requests.length})` : `${t.charAt(0).toUpperCase() + t.slice(1)} (${requests.filter((r) => r.direction === t).length})`}
          </button>
        ))}
      </div>

      {/* Requests list */}
      <div className="space-y-3">
        {filtered.map((req) => {
          const { variant, label } = STATUS_CONFIG[req.status];
          return (
            <div
              key={req.id}
              className="bg-bg-surface border border-bg-border/60 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-text-primary">{req.creatorName}</span>
                    <code className="text-xs text-text-muted">@{req.username}</code>
                    <Badge variant="default" size="sm">{req.category}</Badge>
                    <Badge variant={req.direction === 'incoming' ? 'violet' : 'default'} size="sm">
                      {req.direction}
                    </Badge>
                    <Badge variant={variant} size="sm">{label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <Users size={11} className="text-text-disabled shrink-0" />
                    <span className="text-xs text-text-muted">{formatNumber(req.fans)} fans</span>
                    <Clock size={11} className="text-text-disabled shrink-0" />
                    <span className="text-xs text-text-muted">{relativeTime(req.requestedAt)}</span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">&ldquo;{req.message}&rdquo;</p>
                </div>

                {req.status === 'pending' && req.direction === 'incoming' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => respond(req.id, 'accepted')}
                      className="inline-flex items-center gap-1 text-xs text-success-text hover:text-success-text/80 bg-success-subtle border border-success/20 px-3 py-1.5 rounded transition-colors"
                    >
                      <CheckCircle2 size={12} />
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => respond(req.id, 'declined')}
                      className="inline-flex items-center gap-1 text-xs text-danger-text hover:text-danger-text/80 bg-danger-subtle border border-danger/20 px-3 py-1.5 rounded transition-colors"
                    >
                      <XCircle size={12} />
                      Decline
                    </button>
                  </div>
                )}

                {req.status === 'accepted' && (
                  <Button variant="secondary" size="sm">
                    Schedule S4S
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-bg-surface border border-bg-border/60 rounded-xl py-16 flex flex-col items-center gap-3">
            <Users size={32} className="text-text-disabled" />
            <p className="text-sm text-text-muted">No requests in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
