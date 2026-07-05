'use client';

import { Suspense, useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';
import { apiGet, changePassword } from '@/lib/api';
import { listMedia } from '@/lib/media';
import {
  getWorkspace,
  updateWorkspace,
  getLocaleOptions,
  fetchWorkspaceLogoBlobUrl,
  uploadWorkspaceLogo,
  listMembers,
  addMember,
} from '@/lib/workspace';
import { Button, Input, Avatar, Skeleton, Badge, Tooltip, useToast } from '@/components/ui';
import type { WorkspaceProfile, LocaleOptions, WorkspaceMemberRecord, NewWorkspaceMember } from '@/types/workspace';
import {
  Lock,
  LogOut,
  Bell,
  Building2,
  Image as ImageIcon,
  Globe,
  Cloud,
  Shield,
  UsersRound,
  HelpCircle,
  UploadCloud,
  UserPlus,
  Copy,
  Check,
  Mail,
  type LucideIcon,
} from 'lucide-react';

interface UserProfile {
  email:     string;
  name?:     string;
  createdAt: string;
}

type CategoryId = 'general' | 'branding' | 'localization' | 'storage' | 'security' | 'notifications' | 'users';

const CATEGORIES: { id: CategoryId; label: string; icon: LucideIcon; help: string }[] = [
  { id: 'general',       label: 'General',       icon: Building2,   help: 'Your account and workspace identity.' },
  { id: 'branding',      label: 'Branding',      icon: ImageIcon,   help: 'Your logo and how your workspace looks.' },
  { id: 'localization',  label: 'Localization',  icon: Globe,       help: 'Language, timezone, and formatting for the whole workspace.' },
  { id: 'storage',       label: 'Storage',       icon: Cloud,       help: 'How much media your workspace has stored.' },
  { id: 'security',      label: 'Security',      icon: Shield,      help: 'Password and account protection.' },
  { id: 'notifications', label: 'Notifications', icon: Bell,        help: 'Email and in-app notification preferences.' },
  { id: 'users',         label: 'Users',         icon: UsersRound,  help: 'Everyone with access to this workspace.' },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function SectionHeading({ title, help }: { title: string; help: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      <h2 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em]">{title}</h2>
      <Tooltip content={help} side="right">
        <HelpCircle size={12} className="text-text-disabled hover:text-text-muted transition-colors duration-150" />
      </Tooltip>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageInner />
    </Suspense>
  );
}

function SettingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const initialCategory = (searchParams.get('category') as CategoryId) ?? 'general';
  const [category, setCategory] = useState<CategoryId>(
    CATEGORIES.some((c) => c.id === initialCategory) ? initialCategory : 'general',
  );

  // Account profile
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Workspace
  const [workspace, setWorkspace] = useState<WorkspaceProfile | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);

  // Branding / logo
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoProgress, setLogoProgress] = useState(0);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoDragOver, setLogoDragOver] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Localization
  const [localeOptions, setLocaleOptions] = useState<LocaleOptions | null>(null);
  const [localeForm, setLocaleForm] = useState({
    locale: 'en', timezone: 'UTC', dateFormat: 'MM/DD/YYYY', numberFormat: 'en-US', currency: 'USD',
  });
  const [savingLocale, setSavingLocale] = useState(false);
  const [localeError, setLocaleError] = useState<string | null>(null);

  // Storage
  const [storageLoading, setStorageLoading] = useState(true);
  const [storageStats, setStorageStats] = useState({ count: 0, bytes: 0, images: 0, videos: 0 });

  // Security (existing password form)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Users
  const [members, setMembers] = useState<WorkspaceMemberRecord[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [newMemberResult, setNewMemberResult] = useState<NewWorkspaceMember | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    apiGet<UserProfile>('/users/profile')
      .then((p) => { setUser(p); setProfileLoading(false); })
      .catch(() => setProfileLoading(false));
  }, [router]);

  useEffect(() => {
    getWorkspace()
      .then((w) => {
        setWorkspace(w);
        setLocaleForm({
          locale: w.locale, timezone: w.timezone, dateFormat: w.dateFormat,
          numberFormat: w.numberFormat, currency: w.currency,
        });
      })
      .finally(() => setWorkspaceLoading(false));
    getLocaleOptions().then(setLocaleOptions).catch(() => undefined);
  }, []);

  const loadLogo = useCallback(() => {
    setLogoLoading(true);
    fetchWorkspaceLogoBlobUrl()
      .then(setLogoUrl)
      .catch(() => setLogoUrl(null))
      .finally(() => setLogoLoading(false));
  }, []);

  useEffect(() => {
    loadLogo();
    return () => { if (logoUrl) URL.revokeObjectURL(logoUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadLogo]);

  useEffect(() => {
    setStorageLoading(true);
    listMedia({ limit: 200 })
      .then((result) => {
        setStorageStats({
          count: result.total,
          bytes: result.items.reduce((acc, m) => acc + m.sizeBytes, 0),
          images: result.items.filter((m) => m.type === 'image').length,
          videos: result.items.filter((m) => m.type === 'video').length,
        });
      })
      .catch(() => undefined)
      .finally(() => setStorageLoading(false));
  }, []);

  const loadMembers = useCallback(() => {
    setMembersLoading(true);
    listMembers()
      .then(setMembers)
      .catch(() => undefined)
      .finally(() => setMembersLoading(false));
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  function selectCategory(id: CategoryId) {
    setCategory(id);
    router.replace(`/settings?category=${id}`, { scroll: false });
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (newPassword !== confirmPassword) { setFormError('Passwords do not match'); return; }
    if (newPassword.length < 4) { setFormError('Password must be at least 4 characters'); return; }
    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setFormSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setFormError('Failed to change password. Check your current password.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoFile(file: File) {
    setLogoError(null);
    setUploadingLogo(true);
    setLogoProgress(0);
    try {
      const updated = await uploadWorkspaceLogo(file, { onProgress: setLogoProgress });
      setWorkspace(updated);
      loadLogo();
      showToast('Logo uploaded', 'success');
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function saveLocalization() {
    setSavingLocale(true);
    setLocaleError(null);
    try {
      const updated = await updateWorkspace(localeForm);
      setWorkspace(updated);
      showToast('Workspace updated', 'success');
    } catch (err) {
      setLocaleError(err instanceof Error ? err.message : 'Failed to update localization settings');
    } finally {
      setSavingLocale(false);
    }
  }

  async function submitAddMember() {
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;
    setAddingMember(true);
    setAddMemberError(null);
    try {
      const result = await addMember({ name: newMemberName.trim(), email: newMemberEmail.trim() });
      setShowAddMember(false);
      setNewMemberResult(result);
      setCopiedPassword(false);
      await loadMembers();
      showToast('Team member added', 'success');
    } catch (err) {
      setAddMemberError(err instanceof Error ? err.message : 'Failed to add team member');
    } finally {
      setAddingMember(false);
    }
  }

  function copyTemporaryPassword() {
    if (!newMemberResult?.temporaryPassword) return;
    navigator.clipboard.writeText(newMemberResult.temporaryPassword).then(() => {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    });
  }

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-muted">Manage your account, workspace, and team.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Category nav */}
        <nav className="w-full md:w-52 shrink-0 md:sticky md:top-6">
          <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <li key={id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => selectCategory(id)}
                  className={[
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 whitespace-nowrap',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60',
                    category === id
                      ? 'bg-violet-600/15 text-violet-400'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-subtle',
                  ].join(' ')}
                  aria-current={category === id ? 'page' : undefined}
                >
                  <Icon size={15} className="shrink-0" />
                  {label}
                  {id === 'users' && members.length > 0 && (
                    <Badge variant="default" size="sm" className="ml-auto">{members.length}</Badge>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 max-w-2xl space-y-8">
          {/* ─── General ─────────────────────────────────────────────── */}
          {category === 'general' && (
            <section>
              <SectionHeading title="Account" help={CATEGORIES[0].help} />
              <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
                <div className="flex items-center gap-4 p-5 border-b border-bg-border/40">
                  {profileLoading ? (
                    <>
                      <Skeleton width={40} height={40} rounded="full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton width="42%" height={14} className="rounded" />
                        <Skeleton width="62%" height={12} className="rounded" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Avatar name={user?.name || user?.email} size="lg" />
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{user?.name || 'No name set'}</p>
                        <p className="text-xs text-text-muted mt-0.5">{user?.email}</p>
                      </div>
                    </>
                  )}
                </div>
                {profileLoading ? (
                  <div className="p-5 space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="flex gap-4 items-center">
                        <Skeleton width={96} height={12} className="rounded shrink-0" />
                        <Skeleton width="55%" height={12} className="rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <dl className="divide-y divide-bg-border/40">
                    {[
                      { label: 'Email', value: user?.email ?? '—' },
                      {
                        label: 'Member since',
                        value: user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
                          : '—',
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex gap-4 px-5 py-3">
                        <dt className="text-xs text-text-muted w-28 shrink-0 pt-0.5">{label}</dt>
                        <dd className="text-sm text-text-primary">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>

              <div className="mt-6">
                <SectionHeading title="Workspace" help="Identity of the workspace your team collaborates in." />
                <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
                  {workspaceLoading ? (
                    <div className="p-5 space-y-3">
                      <Skeleton width="50%" height={14} className="rounded" />
                      <Skeleton width="30%" height={12} className="rounded" />
                    </div>
                  ) : (
                    <dl className="divide-y divide-bg-border/40">
                      {[
                        { label: 'Name', value: workspace?.name ?? '—' },
                        { label: 'Plan', value: workspace?.plan ? workspace.plan[0].toUpperCase() + workspace.plan.slice(1) : '—' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex gap-4 px-5 py-3">
                          <dt className="text-xs text-text-muted w-28 shrink-0 pt-0.5">{label}</dt>
                          <dd className="text-sm text-text-primary">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <SectionHeading title="Danger zone" help="Actions that affect only your current session." />
                <div className="bg-bg-surface border border-danger/20 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Sign out</p>
                      <p className="text-xs text-text-muted mt-0.5">You will need to sign in again to regain access.</p>
                    </div>
                    <Button variant="danger" size="sm" icon={LogOut} onClick={logout}>Sign out</Button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ─── Branding ────────────────────────────────────────────── */}
          {category === 'branding' && (
            <section>
              <SectionHeading title="Logo" help={CATEGORIES[1].help} />
              <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-bg-subtle border border-bg-border/60 flex items-center justify-center overflow-hidden shrink-0">
                    {logoLoading ? (
                      <Skeleton width={64} height={64} rounded="lg" />
                    ) : logoUrl ? (
                      // Blob URL from an authed fetch — a plain <img> avoids next/image's
                      // remote-domain allowlist for a URL that only exists client-side.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrl} alt="Workspace logo" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={22} className="text-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      {workspace?.hasLogo ? 'Current logo' : 'No logo uploaded yet'}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">JPG, PNG, or WEBP — resized to 512×512.</p>
                  </div>
                </div>

                <div
                  onDragOver={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setLogoDragOver(true); }}
                  onDragLeave={() => setLogoDragOver(false)}
                  onDrop={(e: DragEvent<HTMLDivElement>) => {
                    e.preventDefault();
                    setLogoDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleLogoFile(file);
                  }}
                  onClick={() => logoInputRef.current?.click()}
                  className={[
                    'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors duration-150',
                    logoDragOver ? 'border-violet-500 bg-violet-600/5' : 'border-bg-border hover:border-bg-muted',
                  ].join(' ')}
                >
                  <UploadCloud size={22} className="text-text-muted" />
                  <p className="text-sm text-text-secondary">
                    <span className="text-violet-400 font-medium">Click to upload</span> or drag and drop
                  </p>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleLogoFile(file); e.target.value = ''; }}
                  />
                </div>

                {uploadingLogo && (
                  <div className="h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 transition-all duration-150" style={{ width: `${logoProgress}%` }} />
                  </div>
                )}
                {logoError && <p className="text-xs text-danger-text">{logoError}</p>}
              </div>

              <div className="mt-6">
                <SectionHeading title="Appearance" help="Additional branding controls, coming soon." />
                <div className="bg-bg-surface border border-bg-border/60 rounded-xl divide-y divide-bg-border/40">
                  {[
                    { label: 'Company name', desc: workspace?.name ?? '—' },
                    { label: 'Accent color', desc: 'Customize your workspace accent color' },
                    { label: 'Favicon', desc: 'Custom browser tab icon' },
                  ].map(({ label, desc }) => (
                    <div key={label} className="flex items-center justify-between gap-4 px-5 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{label}</p>
                        <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                      </div>
                      {label !== 'Company name' && <Badge variant="default" size="sm">Coming soon</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ─── Localization ────────────────────────────────────────── */}
          {category === 'localization' && (
            <section>
              <SectionHeading title="Localization" help={CATEGORIES[2].help} />
              <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 space-y-4">
                {!localeOptions || workspaceLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={32} rounded="lg" />)}
                  </div>
                ) : (
                  <>
                    {[
                      { key: 'locale' as const, label: 'Language', options: localeOptions.locales },
                      { key: 'timezone' as const, label: 'Timezone', options: localeOptions.timezones },
                      { key: 'dateFormat' as const, label: 'Date format', options: localeOptions.dateFormats },
                      { key: 'numberFormat' as const, label: 'Number format', options: localeOptions.numberFormats },
                      { key: 'currency' as const, label: 'Currency', options: localeOptions.currencies },
                    ].map(({ key, label, options }) => (
                      <div key={key} className="flex flex-col gap-1.5">
                        <label htmlFor={key} className="text-xs font-medium text-text-secondary">{label}</label>
                        <select
                          id={key}
                          value={localeForm[key]}
                          onChange={(e) => setLocaleForm((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="h-8 px-3 bg-bg-subtle border border-bg-border rounded-lg text-sm text-text-primary outline-none focus:border-violet-600"
                        >
                          {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                    ))}
                    {localeError && <p className="text-xs text-danger-text">{localeError}</p>}
                    <div className="pt-1">
                      <Button variant="primary" size="md" loading={savingLocale} onClick={saveLocalization}>
                        Save changes
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {/* ─── Storage ─────────────────────────────────────────────── */}
          {category === 'storage' && (
            <section>
              <SectionHeading title="Storage" help={CATEGORIES[3].help} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {storageLoading ? (
                  <>
                    <Skeleton height={68} rounded="lg" />
                    <Skeleton height={68} rounded="lg" />
                    <Skeleton height={68} rounded="lg" />
                  </>
                ) : (
                  [
                    { label: 'Files stored', value: String(storageStats.count) },
                    { label: 'Storage used', value: formatBytes(storageStats.bytes) },
                    { label: 'Photos / Videos', value: `${storageStats.images} / ${storageStats.videos}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-bg-surface border border-bg-border/60 rounded-xl p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-disabled">{label}</p>
                      <p className="mt-1 text-lg font-bold text-text-primary tabular-nums">{value}</p>
                    </div>
                  ))
                )}
              </div>
              {!storageLoading && storageStats.count > 200 && (
                <p className="mt-3 text-xs text-text-muted">
                  Storage used and the photo/video split are based on your first 200 files. Larger libraries will
                  need a paginated total in a future update.
                </p>
              )}
            </section>
          )}

          {/* ─── Security ────────────────────────────────────────────── */}
          {category === 'security' && (
            <section>
              <SectionHeading title="Security" help={CATEGORIES[4].help} />
              <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Change password</h3>
                {formError && (
                  <div className="mb-4 px-3 py-2.5 rounded bg-danger-subtle border border-danger/20 text-danger-text text-sm">
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="mb-4 px-3 py-2.5 rounded bg-success-subtle border border-success/20 text-success-text text-sm">
                    {formSuccess}
                  </div>
                )}
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <Input label="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} leadingIcon={Lock} required />
                  <Input label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} leadingIcon={Lock} hint="Minimum 4 characters" required />
                  <Input label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} leadingIcon={Lock} required />
                  <Button type="submit" variant="primary" size="md" loading={saving}>Update password</Button>
                </form>
              </div>
            </section>
          )}

          {/* ─── Notifications ───────────────────────────────────────── */}
          {category === 'notifications' && (
            <section>
              <SectionHeading title="Notifications" help={CATEGORIES[5].help} />
              <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-600/10 flex items-center justify-center shrink-0">
                      <Bell size={14} className="text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Notification preferences</p>
                      <p className="text-xs text-text-muted mt-0.5">Email and in-app notification settings</p>
                    </div>
                  </div>
                  <Badge variant="default" size="sm">Coming soon</Badge>
                </div>
              </div>
            </section>
          )}

          {/* ─── Users ───────────────────────────────────────────────── */}
          {category === 'users' && (
            <section>
              <div className="flex items-center justify-between gap-4 mb-3">
                <SectionHeading title="Workspace users" help={CATEGORIES[6].help} />
                <Button variant="primary" size="sm" icon={UserPlus} onClick={() => { setShowAddMember(true); setAddMemberError(null); setNewMemberName(''); setNewMemberEmail(''); }}>
                  Add user
                </Button>
              </div>
              <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
                {membersLoading ? (
                  <div className="divide-y divide-bg-border/40">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                        <Skeleton width={32} height={32} rounded="full" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton width="30%" height={12} rounded="sm" />
                          <Skeleton width="45%" height={11} rounded="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="divide-y divide-bg-border/40">
                    {members.map((member) => (
                      <li key={member.id} className="flex items-center gap-3 px-4 py-3.5">
                        <Avatar name={member.user.name ?? member.user.email} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{member.user.name || member.user.email}</p>
                          <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                            <Mail size={11} className="shrink-0" />
                            {member.user.email}
                          </p>
                        </div>
                        <Badge variant="violet" size="sm">{member.role}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Add member modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowAddMember(false)} />
          <div className="relative w-full max-w-md bg-bg-surface border border-bg-border rounded-2xl shadow-soft-lg animate-fade-in p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text-primary">Add a user</h2>
            <Input label="Name" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="e.g. Taylor Kim" autoFocus />
            <Input label="Email" type="email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} placeholder="taylor@example.com" />
            <p className="text-xs text-text-muted">
              If this email doesn&apos;t have an account yet, we&apos;ll create one and give you a temporary password to share with them.
            </p>
            {addMemberError && <p className="text-xs text-danger-text">{addMemberError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddMember(false)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                loading={addingMember}
                disabled={!newMemberName.trim() || !newMemberEmail.trim()}
                onClick={submitAddMember}
              >
                Add user
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New member temporary password (shown exactly once) */}
      {newMemberResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setNewMemberResult(null)} />
          <div className="relative w-full max-w-md bg-bg-surface border border-bg-border rounded-2xl shadow-soft-lg animate-fade-in p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text-primary">
              {newMemberResult.temporaryPassword ? `${newMemberResult.user.name || newMemberResult.user.email} was added` : 'User added'}
            </h2>
            {newMemberResult.temporaryPassword ? (
              <>
                <p className="text-sm text-text-secondary">
                  A new account was created for {newMemberResult.user.email}.{' '}
                  {newMemberResult.emailSent
                    ? "We've emailed them their login details. You can also share this temporary password directly — it won't be shown again."
                    : "We couldn't email them (check your Communication settings) — share this temporary password with them directly. It won't be shown again."}
                </p>
                <div className="flex items-center gap-2 bg-bg-subtle border border-bg-border rounded-lg px-3 py-2">
                  <code className="flex-1 text-sm text-text-primary font-mono truncate">
                    {newMemberResult.temporaryPassword}
                  </code>
                  <button
                    type="button"
                    onClick={copyTemporaryPassword}
                    className="shrink-0 text-text-muted hover:text-violet-400 transition-colors duration-150"
                    aria-label="Copy temporary password"
                  >
                    {copiedPassword ? <Check size={15} className="text-success-text" /> : <Copy size={15} />}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-text-secondary">
                {newMemberResult.user.email} already had an account and has been added to this workspace.
                {newMemberResult.emailSent
                  ? " We've emailed them to let them know."
                  : " We couldn't email them to let them know — you may want to reach out directly."}
              </p>
            )}
            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setNewMemberResult(null)}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
