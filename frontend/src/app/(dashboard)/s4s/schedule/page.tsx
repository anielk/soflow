'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Badge, Button } from '@/components/ui';
import { CalendarPlus, Calendar, Users, Clock } from 'lucide-react';

interface S4SSession {
  id:          string;
  creatorName: string;
  username:    string;
  scheduledAt: string;
  duration:    string;
  type:        'shoutout' | 'collab' | 'guest_post';
  status:      'upcoming' | 'in_progress' | 'completed';
  notes?:      string;
}

const MOCK_SESSIONS: S4SSession[] = [
  { id: 'ss1', creatorName: 'TravelWithLuna', username: 'travelwithluna', scheduledAt: '2026-06-29T14:00:00Z', duration: '24h',  type: 'shoutout',   status: 'upcoming',    notes: 'Mutual shoutout in feed posts. Both parties agreed on caption template.' },
  { id: 'ss2', creatorName: 'FitByNature',    username: 'fitbynature',    scheduledAt: '2026-07-02T10:00:00Z', duration: '48h',  type: 'collab',     status: 'upcoming',    notes: 'Joint workout series. Both create 3 exclusive posts for each other\'s audience.' },
  { id: 'ss3', creatorName: 'YogaWithSarah',  username: 'yogawithsarah',  scheduledAt: '2026-06-25T09:00:00Z', duration: '24h',  type: 'shoutout',   status: 'completed',   notes: 'Completed. Emma gained 48 new subs.' },
  { id: 'ss4', creatorName: 'DanceByAlex',    username: 'dancebyalex',    scheduledAt: '2026-07-05T15:00:00Z', duration: '72h',  type: 'guest_post', status: 'upcoming' },
];

const TYPE_CONFIG = {
  shoutout:   { label: 'Shoutout',    color: '#8B5CF6' },
  collab:     { label: 'Collab',      color: '#10B981' },
  guest_post: { label: 'Guest post',  color: '#3B82F6' },
};

const STATUS_CONFIG: Record<S4SSession['status'], { variant: 'success' | 'default' | 'warning'; label: string }> = {
  upcoming:    { variant: 'default', label: 'Upcoming'    },
  in_progress: { variant: 'success', label: 'In progress' },
  completed:   { variant: 'default', label: 'Completed'   },
};

function formatScheduledDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function groupByWeek(sessions: S4SSession[]): [string, S4SSession[]][] {
  const map = new Map<string, S4SSession[]>();
  for (const s of sessions) {
    const d = new Date(s.scheduledAt);
    const week = `Week of ${new Date(d.setDate(d.getDate() - d.getDay())).toLocaleDateString('en-GB', { month: 'long', day: 'numeric' })}`;
    if (!map.has(week)) map.set(week, []);
    map.get(week)!.push(s);
  }
  return Array.from(map.entries());
}

export default function S4SSchedulePage() {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  const groups = groupByWeek([...MOCK_SESSIONS].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">S4S Schedule</h1>
          <p className="mt-1 text-sm text-text-muted">Upcoming and past share-for-share sessions</p>
        </div>
        <Button variant="primary" size="md" icon={CalendarPlus}>
          Schedule session
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Upcoming sessions', value: String(MOCK_SESSIONS.filter((s) => s.status === 'upcoming').length),   icon: Calendar, color: '#8B5CF6' },
          { label: 'Partners',          value: String(new Set(MOCK_SESSIONS.map((s) => s.username)).size),            icon: Users,    color: '#3B82F6' },
          { label: 'Completed',         value: String(MOCK_SESSIONS.filter((s) => s.status === 'completed').length),  icon: Clock,    color: '#10B981' },
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

      {/* Session groups */}
      <div className="space-y-6">
        {groups.map(([week, sessions]) => (
          <div key={week}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-sm font-semibold text-text-secondary">{week}</h2>
              <div className="flex-1 h-px bg-bg-border/40" />
            </div>

            <div className="space-y-3">
              {sessions.map((session) => {
                const { variant, label: statusLabel } = STATUS_CONFIG[session.status];
                const { label: typeLabel, color: typeColor } = TYPE_CONFIG[session.type];
                return (
                  <div
                    key={session.id}
                    className="bg-bg-surface border border-bg-border/60 rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="font-semibold text-text-primary">{session.creatorName}</span>
                          <code className="text-xs text-text-muted">@{session.username}</code>
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide"
                            style={{ color: typeColor, background: `${typeColor}18` }}
                          >
                            {typeLabel}
                          </span>
                          <Badge variant={variant} size="sm">{statusLabel}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <div className="flex items-center gap-1">
                            <Calendar size={11} />
                            <span>{formatScheduledDate(session.scheduledAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={11} />
                            <span>{session.duration}</span>
                          </div>
                        </div>
                        {session.notes && (
                          <p className="text-xs text-text-muted mt-2 leading-relaxed">{session.notes}</p>
                        )}
                      </div>

                      {session.status === 'upcoming' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button type="button" className="text-xs text-text-muted hover:text-violet-400 transition-colors">
                            Edit
                          </button>
                          <button type="button" className="text-xs text-text-muted hover:text-danger-text transition-colors">
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
