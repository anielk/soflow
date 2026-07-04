import {
  LayoutGrid,
  Users,
  FileText,
  Image as ImageIcon,
  Calendar,
  BarChart3,
  Sparkles,
  UserCog,
  Settings,
  ChevronDown,
  Bell,
  CalendarPlus,
  CreditCard,
  UserPlus,
} from 'lucide-react';
import { LogoIcon } from '@/components/brand/Logo';

// A detailed, clearly-illustrative dashboard mockup — no real screenshot
// exists yet, so every number/name here is representative sample data, not
// a claim about real usage.

const NAV_ITEMS = [
  { icon: LayoutGrid, label: 'Overview', active: true },
  { icon: Users, label: 'Creators' },
  { icon: FileText, label: 'Content' },
  { icon: ImageIcon, label: 'Media Library' },
  { icon: Calendar, label: 'Calendar' },
  { icon: BarChart3, label: 'Analytics' },
  { icon: Sparkles, label: 'AI Assistant' },
  { icon: UserCog, label: 'Team' },
  { icon: Settings, label: 'Settings' },
];

const STATS = [
  { label: 'Total Revenue', value: '€128,430', delta: '+24.5% vs last 7 days' },
  { label: 'Content Published', value: '247', delta: '+18.3% vs last 7 days' },
  { label: 'Engagement', value: '2.43M', delta: '+32.1% vs last 7 days' },
  { label: 'Active Creators', value: '32', delta: '+8.6% vs last 7 days' },
];

const CHART_DAYS = ['May 12', 'May 13', 'May 14', 'May 15', 'May 16', 'May 17', 'May 18'];
// Illustrative points only, plotted on a 0–4M y-axis.
const CHART_VALUES = [1.6, 1.3, 2.1, 1.9, 2.6, 2.3, 3.1];

const ACTIVITY = [
  { icon: CalendarPlus, text: 'New content scheduled', meta: '@jessica.smith · 2h ago' },
  { icon: Sparkles, text: 'AI caption generated', meta: '@matt.johnson · 3h ago' },
  { icon: CreditCard, text: 'Payment received', meta: '@taylor.made · 5h ago' },
  { icon: UserPlus, text: 'New creator added', meta: '@emma.visuals · 1d ago' },
];

function chartPoints(width: number, height: number) {
  const max = 4;
  const step = width / (CHART_VALUES.length - 1);
  return CHART_VALUES.map((v, i) => `${i * step},${height - (v / max) * height}`).join(' ');
}

export function DashboardMockup() {
  const chartWidth = 480;
  const chartHeight = 140;

  return (
    // "group" + the ambient glow behind it is what makes this read as the
    // hero product rather than another illustration on the page — the glow
    // reuses the existing brand gradient (just blurred), no new color.
    <div className="relative group">
      <div
        aria-hidden="true"
        className="absolute -inset-6 sm:-inset-10 -z-10 bg-gradient-primary opacity-[0.15] blur-3xl rounded-[2.5rem] transition-opacity duration-500 group-hover:opacity-[0.22]"
      />
      <div
        className="relative rounded-2xl border border-bg-border bg-bg-surface shadow-soft-lg overflow-hidden flex transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_24px_60px_-10px_rgba(0,0,0,0.45)]"
        role="img"
        aria-label="Illustration of the Leinaflow dashboard interface, showing sample agency metrics and activity"
      >
        {/* Sidebar */}
        <div className="hidden md:flex w-52 shrink-0 flex-col border-r border-bg-border p-5">
          <div className="flex items-center gap-2 px-1 mb-7">
            <LogoIcon size="sm" />
            <span className="text-sm font-bold tracking-tight text-text-primary">Leinaflow</span>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={[
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium',
                  active ? 'bg-violet-600/15 text-violet-400' : 'text-text-muted',
                ].join(' ')}
              >
                <Icon size={14} className="shrink-0" />
                {label}
              </div>
            ))}
          </nav>
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0 p-6 sm:p-8">
          {/* Topbar */}
          <div className="flex items-center justify-end gap-3 mb-7">
            <div className="hidden sm:flex items-center gap-1.5 h-7 px-3 rounded-lg border border-bg-border text-xs text-text-muted">
              May 12 – May 18, 2025
              <ChevronDown size={12} />
            </div>
            <Bell size={15} className="text-text-muted" />
            <div className="w-7 h-7 rounded-full bg-gradient-primary" />
          </div>

          {/* Illustrative label, not a real heading — this whole component is
              presented as a picture (role="img" on the wrapper), so its
              internal text shouldn't join the page's actual heading outline. */}
          <p className="text-base font-semibold text-text-primary">Welcome back, Alex 👋</p>
          <p className="text-xs text-text-muted mt-1">Here&apos;s what&apos;s happening across your agency today.</p>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="rounded-xl bg-bg-subtle p-4">
                <p className="text-[11px] text-text-muted">{stat.label}</p>
                <p className="mt-1 text-lg font-semibold text-text-primary">{stat.value}</p>
                <p className="mt-0.5 text-[10px] text-success">↑ {stat.delta}</p>
              </div>
            ))}
          </div>

          {/* Chart + activity */}
          <div className="grid lg:grid-cols-[2fr_1fr] gap-4 mt-4">
            <div className="rounded-xl bg-bg-subtle p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-text-primary">Content Performance</p>
                <div className="flex items-center gap-1 text-[10px] text-text-muted">
                  Views <ChevronDown size={10} />
                </div>
              </div>
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-24 sm:h-28" preserveAspectRatio="none">
                <polyline
                  points={chartPoints(chartWidth, chartHeight)}
                  fill="none"
                  stroke="#A855F7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {CHART_VALUES.map((v, i) => {
                  const step = chartWidth / (CHART_VALUES.length - 1);
                  return (
                    <circle key={i} cx={i * step} cy={chartHeight - (v / 4) * chartHeight} r="3" fill="#A855F7" />
                  );
                })}
              </svg>
              <div className="flex justify-between mt-1 text-[9px] text-text-disabled">
                {CHART_DAYS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-bg-subtle p-5">
              <p className="text-xs font-medium text-text-primary mb-3">Recent Activity</p>
              <div className="flex flex-col gap-3">
                {ACTIVITY.map(({ icon: Icon, text, meta }) => (
                  <div key={text} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-lg bg-violet-600/15 flex items-center justify-center shrink-0">
                      <Icon size={12} className="text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-text-primary leading-tight">{text}</p>
                      <p className="text-[10px] text-text-disabled truncate">{meta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
