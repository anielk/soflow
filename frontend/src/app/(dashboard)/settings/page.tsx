'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';
import { apiGet, changePassword } from '@/lib/api';
import { Button, Input, Avatar, Skeleton, Badge } from '@/components/ui';
import { Lock, LogOut, Bell } from 'lucide-react';

interface UserProfile {
  email:     string;
  name?:     string;
  createdAt: string;
}

export default function SettingsPage() {
  const [user, setUser]                       = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading]   = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving]                   = useState(false);
  const [formError, setFormError]             = useState('');
  const [formSuccess, setFormSuccess]         = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    apiGet<UserProfile>('/users/profile')
      .then((p) => { setUser(p); setProfileLoading(false); })
      .catch(() => setProfileLoading(false));
  }, [router]);

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

  return (
    <div className="max-w-2xl space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-muted">Manage your account and preferences.</p>
      </div>

      {/* Account section */}
      <section>
        <h2 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] mb-3">
          Account
        </h2>
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
          {/* Profile header */}
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
                  <p className="text-sm font-semibold text-text-primary">
                    {user?.name || 'No name set'}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{user?.email}</p>
                </div>
              </>
            )}
          </div>

          {/* Profile details */}
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
                    ? new Date(user.createdAt).toLocaleDateString('en-GB', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })
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
      </section>

      {/* Security section */}
      <section>
        <h2 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] mb-3">
          Security
        </h2>
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
            <Input
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              leadingIcon={Lock}
              required
            />
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leadingIcon={Lock}
              hint="Minimum 4 characters"
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leadingIcon={Lock}
              required
            />
            <Button type="submit" variant="primary" size="md" loading={saving}>
              Update password
            </Button>
          </form>
        </div>
      </section>

      {/* Notifications section — coming soon */}
      <section>
        <h2 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] mb-3">
          Notifications
        </h2>
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-600/10 flex items-center justify-center shrink-0">
                <Bell size={14} className="text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Notification preferences</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Email and in-app notification settings
                </p>
              </div>
            </div>
            <Badge variant="default" size="sm">Coming soon</Badge>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <h2 className="text-[11px] font-semibold text-danger-text uppercase tracking-[0.06em] mb-3">
          Danger zone
        </h2>
        <div className="bg-bg-surface border border-danger/20 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Sign out</p>
              <p className="text-xs text-text-muted mt-0.5">
                You will need to sign in again to regain access.
              </p>
            </div>
            <Button variant="danger" size="sm" icon={LogOut} onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
