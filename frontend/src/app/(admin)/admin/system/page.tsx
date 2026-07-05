'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ScrollText,
  Activity as ActivityIcon,
  HeartPulse,
  Tag,
  Globe2,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { Badge, Skeleton, Button } from '@/components/ui';
import {
  getAuditLog,
  getAuditCategories,
  getActivityLog,
  getHealthReport,
  getVersion,
  getEnvironment,
  getInstalledModules,
  type AuditLogEntry,
  type ActivityLogEntry,
  type HealthReport,
  type VersionInfo,
  type EnvironmentInfo,
  type InstalledModule,
} from '@/lib/system';

type Tab = 'audit' | 'activity' | 'health' | 'version' | 'environment';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'audit', label: 'Audit Log', icon: ScrollText },
  { id: 'activity', label: 'Activity', icon: ActivityIcon },
  { id: 'health', label: 'Health', icon: HeartPulse },
  { id: 'version', label: 'Version', icon: Tag },
  { id: 'environment', label: 'Environment', icon: Globe2 },
];

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

const CATEGORY_BADGE: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'violet'> = {
  AUTH: 'violet',
  WORKSPACE: 'default',
  MEDIA: 'default',
  CREATOR: 'default',
  USER: 'violet',
  NOTIFICATION: 'default',
  SETTINGS: 'default',
  SECURITY: 'danger',
  SYSTEM: 'warning',
};

// ─── Audit Log ──────────────────────────────────────────────────────────────

function AuditTab() {
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 25;

  useEffect(() => {
    getAuditCategories().then((r) => setCategories(r.categories)).catch(() => undefined);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getAuditLog({
      category: category || undefined,
      search: debouncedSearch || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
      limit,
    })
      .then((result) => {
        setEntries(result.items);
        setTotal(result.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load audit log'))
      .finally(() => setLoading(false));
  }, [category, debouncedSearch, dateFrom, dateTo, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [category, debouncedSearch, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-muted">
        Append-only administrative trail. Every entry here is permanent — there is no edit or delete action.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-8 px-3 bg-bg-surface border border-bg-border/60 rounded-lg text-xs text-text-secondary outline-none focus:border-violet-600"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-8 px-3 bg-bg-surface border border-bg-border/60 rounded-lg text-xs text-text-secondary outline-none focus:border-violet-600"
        />
        <span className="text-xs text-text-disabled">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-8 px-3 bg-bg-surface border border-bg-border/60 rounded-lg text-xs text-text-secondary outline-none focus:border-violet-600"
        />
        <div className="flex items-center gap-2 px-3 h-8 bg-bg-surface border border-bg-border/60 rounded-lg flex-1 min-w-[160px] max-w-xs">
          <Search size={12} className="text-text-muted shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search event type or target…"
            className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted outline-none"
          />
        </div>
      </div>

      {error && <p className="text-xs text-danger-text">{error}</p>}

      {/* Table */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-bg-border/40">
                {['Time', 'Category', 'Event', 'User', 'Target', 'IP'].map((h) => (
                  <th key={h} className="text-left font-semibold text-text-disabled uppercase tracking-[0.06em] px-3 py-2.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border/40">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-3 py-2.5"><Skeleton height={14} rounded="sm" /></td>
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-text-muted">No audit events match these filters.</td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-bg-subtle/40">
                    <td className="px-3 py-2.5 text-text-muted whitespace-nowrap">{formatTimestamp(entry.createdAt)}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant={CATEGORY_BADGE[entry.category] ?? 'default'} size="sm">{entry.category}</Badge>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-text-secondary">{entry.eventType}</td>
                    <td className="px-3 py-2.5 text-text-muted">{entry.userLabel ?? entry.userId ?? '—'}</td>
                    <td className="px-3 py-2.5 text-text-muted">
                      {entry.targetType ? `${entry.targetType}${entry.targetId ? ` · ${entry.targetId.slice(0, 8)}` : ''}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-text-disabled">{entry.ipAddress ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-3 py-2.5 border-t border-bg-border/40">
          <span className="text-[11px] text-text-disabled">{total} events</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-violet-400 disabled:opacity-30 disabled:hover:text-text-muted transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[11px] text-text-muted tabular-nums">{page} / {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-violet-400 disabled:opacity-30 disabled:hover:text-text-muted transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Activity ───────────────────────────────────────────────────────────────

function ActivityTab() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 25;

  useEffect(() => {
    setLoading(true);
    getActivityLog({ page, limit })
      .then((result) => { setEntries(result.items); setTotal(result.total); })
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-muted">
        Human-readable feed of what happened across every workspace — the same events as the audit log, filtered to
        what a person would want to read (security-sensitive events like failed logins are intentionally omitted).
      </p>

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={14} rounded="sm" />)}
          </div>
        ) : entries.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-text-muted">No activity recorded yet.</p>
        ) : (
          <ul className="divide-y divide-bg-border/40">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 px-4 py-3">
                <Clock size={13} className="text-text-disabled shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{entry.message}</p>
                  <p className="text-[11px] text-text-disabled mt-0.5">{formatTimestamp(entry.createdAt)}</p>
                </div>
                <Badge variant={CATEGORY_BADGE[entry.category] ?? 'default'} size="sm">{entry.category}</Badge>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between px-3 py-2.5 border-t border-bg-border/40">
          <span className="text-[11px] text-text-disabled">{total} events</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-violet-400 disabled:opacity-30 transition-colors">
              <ChevronLeft size={14} />
            </button>
            <span className="text-[11px] text-text-muted tabular-nums">{page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-violet-400 disabled:opacity-30 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Health ─────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { label: string; cls: string; icon: LucideIcon }> = {
  ok: { label: 'Operational', cls: 'text-success-text bg-success-subtle border-success/20', icon: CheckCircle2 },
  degraded: { label: 'Degraded', cls: 'text-warning-text bg-warning-subtle border-warning/20', icon: AlertCircle },
  down: { label: 'Down', cls: 'text-danger-text bg-danger-subtle border-danger/20', icon: AlertCircle },
  not_configured: { label: 'Not configured', cls: 'text-text-disabled bg-bg-subtle border-bg-border', icon: Clock },
  planned: { label: 'Planned', cls: 'text-text-disabled bg-bg-subtle border-bg-border', icon: Clock },
};

const CHECK_NAME_LABEL: Record<string, string> = {
  api: 'API',
  ai: 'AI',
  cpos: 'CPOS',
};

function checkLabel(name: string): string {
  return CHECK_NAME_LABEL[name] ?? name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function HealthTab() {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getHealthReport()
      .then(setReport)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load health report'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const overall = report ? STATUS_STYLE[report.status] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">Live checks — nothing here is cached or simulated.</p>
        <Button variant="ghost" size="sm" icon={RefreshCw} onClick={load} loading={loading}>Refresh</Button>
      </div>

      {error && <p className="text-xs text-danger-text">{error}</p>}

      {loading && !report ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={72} rounded="lg" />)}
        </div>
      ) : report ? (
        <>
          <div className={['flex items-center gap-2.5 rounded-xl border px-4 py-3', overall!.cls].join(' ')}>
            {(() => { const Icon = overall!.icon; return <Icon size={16} className="shrink-0" />; })()}
            <div>
              <p className="text-sm font-medium">Overall: {overall!.label}</p>
              <p className="text-[11px] opacity-80">Uptime {Math.floor(report.uptimeSeconds / 60)}m · {new Date(report.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {report.checks.map((check) => {
              const style = STATUS_STYLE[check.status];
              const Icon = style.icon;
              return (
                <div key={check.name} className="bg-bg-surface border border-bg-border/60 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-text-secondary">{checkLabel(check.name)}</span>
                    <Icon size={13} className={style.cls.split(' ')[0]} />
                  </div>
                  <span className={['inline-block text-[10px] px-1.5 py-0.5 rounded font-medium border', style.cls].join(' ')}>
                    {style.label}
                  </span>
                  {check.latencyMs !== undefined && (
                    <p className="text-[11px] text-text-disabled">{check.latencyMs}ms</p>
                  )}
                  {check.message && <p className="text-[11px] text-text-disabled">{check.message}</p>}
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

// ─── Version ────────────────────────────────────────────────────────────────

function VersionTab() {
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [modules, setModules] = useState<InstalledModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getVersion(), getInstalledModules()])
      .then(([v, m]) => { setVersion(v); setModules(m.modules); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={14} rounded="sm" />)}</div>
        ) : (
          <dl className="divide-y divide-bg-border/40">
            {[
              { label: 'App version', value: version?.appVersion ?? '—' },
              { label: 'Node.js', value: version?.nodeVersion ?? '—' },
              { label: 'Git commit', value: version?.gitCommit ?? 'Not available in this environment' },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-4 px-4 py-2.5">
                <dt className="text-xs text-text-muted w-32 shrink-0">{label}</dt>
                <dd className="text-sm text-text-primary font-mono">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div>
        <p className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] mb-2">Installed modules</p>
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl divide-y divide-bg-border/40">
          {modules.map((m) => (
            <div key={m.name} className="flex items-center justify-between gap-4 px-4 py-2.5">
              <span className="text-sm font-medium text-text-primary">{m.name}</span>
              <span className="text-xs text-text-muted text-right">{m.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Environment ────────────────────────────────────────────────────────────

function EnvironmentTab() {
  const [env, setEnv] = useState<EnvironmentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEnvironment().then(setEnv).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
      {loading ? (
        <div className="p-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={14} rounded="sm" />)}</div>
      ) : (
        <dl className="divide-y divide-bg-border/40">
          {[
            { label: 'Environment', value: env?.nodeEnv ?? '—' },
            { label: 'Storage driver', value: env?.storageDriver ?? '—' },
            { label: 'Notification driver', value: env?.notificationDriver ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-4 px-4 py-2.5">
              <dt className="text-xs text-text-muted w-40 shrink-0">{label}</dt>
              <dd className="text-sm text-text-primary font-mono">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

const TAB_CONTENT = {
  audit: AuditTab,
  activity: ActivityTab,
  health: HealthTab,
  version: VersionTab,
  environment: EnvironmentTab,
};

export default function SystemPage() {
  const [activeTab, setActiveTab] = useState<Tab>('audit');
  const TabContent = TAB_CONTENT[activeTab];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">System</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Observability and audit foundation — read-only, the groundwork CPOS will later consume.
        </p>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                active
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-surface border border-transparent',
              ].join(' ')}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <TabContent />
    </div>
  );
}
