'use client';

import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { ChartDataPoint } from '@/types/dashboard';
import { formatCurrency } from '@/lib/format';

interface RevenueChartProps {
  data:     ChartDataPoint[];
  loading?: boolean;
}

type SeriesKey = 'subscriptions' | 'tips' | 'ppv';

const SERIES: { key: SeriesKey; label: string; color: string }[] = [
  { key: 'subscriptions', label: 'Subscriptions', color: '#8B5CF6' },
  { key: 'tips',          label: 'Tips',          color: '#EC4899' },
  { key: 'ppv',           label: 'PPV',           color: '#3B82F6' },
];

interface TooltipEntry {
  name:  string;
  value: number;
  color: string;
}

function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?:  boolean;
  payload?: TooltipEntry[];
  label?:   string;
}) {
  if (!active || !payload?.length) return null;

  const dateLabel = label
    ? new Date(label).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : '';

  return (
    <div className="bg-bg-overlay border border-bg-border rounded-lg shadow-dropdown px-3.5 py-3 min-w-[160px]">
      <p className="text-xs text-text-muted mb-2">{dateLabel}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-text-secondary capitalize">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold text-text-primary tabular-nums">
            {formatCurrency(entry.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart({ data, loading = false }: RevenueChartProps) {
  const [visible, setVisible] = useState<Set<SeriesKey>>(new Set());

  function toggleSeries(key: SeriesKey) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="bg-bg-surface border border-bg-border rounded-xl p-6 shadow-card h-full">
        <div className="h-4 w-28 bg-bg-muted rounded mb-2 animate-skeleton" />
        <div className="h-3 w-20 bg-bg-muted rounded mb-6 animate-skeleton" />
        <div className="h-[220px] bg-bg-muted rounded-lg animate-skeleton" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-bg-surface border border-bg-border rounded-xl p-6 shadow-card flex items-center justify-center h-full">
        <p className="text-sm text-text-muted">No chart data for this period</p>
      </div>
    );
  }

  const xTickInterval = data.length <= 7 ? 0 : data.length <= 14 ? 1 : 4;

  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-6 shadow-card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Revenue trend</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {data.length === 1 ? 'Today' : `${data.length}-day overview`}
          </p>
        </div>

        {/* Series toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {SERIES.map(({ key, label, color }) => {
            const on = visible.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleSeries(key)}
                className={[
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-medium transition-all duration-150 border',
                  on
                    ? 'border-transparent text-white'
                    : 'border-bg-border text-text-muted hover:text-text-secondary hover:border-bg-muted',
                ].join(' ')}
                style={on ? { backgroundColor: color, borderColor: color } : {}}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: on ? 'white' : color }}
                />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272A"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(v: string) =>
                new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
              }
              tick={{ fill: '#71717A', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={xTickInterval}
              dy={6}
            />
            <YAxis
              tickFormatter={(v: number) => formatCurrency(v, true)}
              tick={{ fill: '#71717A', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip
              content={<ChartTooltipContent />}
              cursor={{ stroke: '#3F3F46', strokeWidth: 1 }}
            />

            {/* Main revenue line — always visible */}
            <Line
              type="monotone"
              dataKey="revenue"
              name="revenue"
              stroke="#7C3AED"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#7C3AED', stroke: '#09090B', strokeWidth: 2 }}
            />

            {/* Breakdown lines — toggled */}
            {SERIES.map(({ key, color }) =>
              visible.has(key) ? (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key}
                  stroke={color}
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={false}
                  activeDot={{ r: 3, fill: color, stroke: '#09090B', strokeWidth: 1.5 }}
                />
              ) : null,
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
