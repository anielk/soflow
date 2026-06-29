'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Avatar, Badge, Button } from '@/components/ui';
import { CalendarPlus, Clock } from 'lucide-react';
import { MOCK_SHIFTS } from '@/lib/mock-employees';
import type { Shift, ShiftStatus } from '@/types/employee';

const STATUS_CONFIG: Record<ShiftStatus, { variant: 'success' | 'warning' | 'default' | 'danger'; label: string }> = {
  upcoming:    { variant: 'default',  label: 'Upcoming'    },
  in_progress: { variant: 'success',  label: 'In progress' },
  completed:   { variant: 'default',  label: 'Completed'   },
  missed:      { variant: 'danger',   label: 'Missed'      },
};

function formatShiftTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatShiftDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function shiftDurationHours(start: string, end: string) {
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  return (diffMs / 3_600_000).toFixed(1);
}

function groupByDate(shifts: Shift[]): [string, Shift[]][] {
  const map = new Map<string, Shift[]>();
  for (const s of shifts) {
    const key = s.startAt.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export default function ShiftSchedulePage() {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  const groups = groupByDate(MOCK_SHIFTS);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Shift schedule</h1>
          <p className="mt-1 text-sm text-text-muted">
            Upcoming and ongoing shifts across your team
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={() => router.push('/employees')}>
            All employees
          </Button>
          <Button variant="primary" size="md" icon={CalendarPlus}>
            Add shift
          </Button>
        </div>
      </div>

      {/* Summary row */}
      <div className="flex items-center gap-6">
        {[
          { label: 'Shifts this week', value: String(MOCK_SHIFTS.length) },
          { label: 'In progress',      value: String(MOCK_SHIFTS.filter((s) => s.status === 'in_progress').length) },
          { label: 'Upcoming',         value: String(MOCK_SHIFTS.filter((s) => s.status === 'upcoming').length) },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-lg font-bold text-text-primary tabular-nums">{value}</span>
            <span className="text-sm text-text-muted">{label}</span>
          </div>
        ))}
      </div>

      {/* Groups */}
      <div className="space-y-6">
        {groups.map(([date, shifts]) => (
          <div key={date}>
            {/* Day header */}
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-sm font-semibold text-text-secondary">
                {formatShiftDate(shifts[0].startAt)}
              </h2>
              <div className="flex-1 h-px bg-bg-border/40" />
              <span className="text-xs text-text-muted">{shifts.length} shift{shifts.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-bg-border/40">
                      {['Employee', 'Start', 'End', 'Duration', 'Creators', 'Status', ''].map((col) => (
                        <th
                          key={col}
                          className="text-left text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bg-border/40">
                    {shifts.map((shift) => {
                      const { variant, label } = STATUS_CONFIG[shift.status];
                      return (
                        <tr
                          key={shift.id}
                          className="hover:bg-bg-subtle/40 transition-colors duration-100"
                        >
                          {/* Employee */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={shift.employeeName} size="sm" />
                              <span className="font-medium text-text-primary">{shift.employeeName}</span>
                            </div>
                          </td>

                          {/* Start */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-text-secondary">
                              <Clock size={12} className="text-text-muted" />
                              <span className="tabular-nums">{formatShiftTime(shift.startAt)}</span>
                            </div>
                          </td>

                          {/* End */}
                          <td className="px-4 py-3 text-text-secondary tabular-nums">
                            {formatShiftTime(shift.endAt)}
                          </td>

                          {/* Duration */}
                          <td className="px-4 py-3 text-text-muted tabular-nums text-xs">
                            {shiftDurationHours(shift.startAt, shift.endAt)}h
                          </td>

                          {/* Creators */}
                          <td className="px-4 py-3">
                            {shift.creatorsAssigned.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {shift.creatorsAssigned.map((c) => (
                                  <span
                                    key={c}
                                    className="text-xs bg-bg-subtle border border-bg-border/60 px-2 py-0.5 rounded text-text-secondary capitalize"
                                  >
                                    {c.replace('-', ' ')}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-text-disabled text-xs">Unassigned</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <Badge variant={variant} size="sm">{label}</Badge>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className="text-xs text-text-muted hover:text-violet-400 transition-colors"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
