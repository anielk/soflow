'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';
import { apiGet, changePassword } from '@/lib/api';
import { Button, Input } from '@/components/ui';
import { Lock, LogOut } from 'lucide-react';

interface UserProfile {
  email:     string;
  name?:     string;
  createdAt: string;
}

export default function SettingsPage() {
  const [user, setUser]                   = useState<UserProfile | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    apiGet<UserProfile>('/users/profile')
      .then((p) => { setUser(p); setLoading(false); })
      .catch(() => { setError('Failed to load profile'); setLoading(false); });
  }, [router]);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (newPassword.length < 4) { setError('Password must be at least 4 characters'); return; }

    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Failed to change password. Check your current password.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-text-muted text-sm">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile information */}
      <section className="bg-bg-surface border border-bg-border rounded-lg p-6">
        <h2 className="text-base font-semibold text-text-primary mb-4">Profile information</h2>
        {user && (
          <dl className="space-y-3">
            {[
              { label: 'Email',   value: user.email },
              { label: 'Name',    value: user.name || '—' },
              { label: 'Member since', value: new Date(user.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-4">
                <dt className="text-sm text-text-muted w-28 shrink-0">{label}</dt>
                <dd className="text-sm text-text-primary">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/* Change password */}
      <section className="bg-bg-surface border border-bg-border rounded-lg p-6">
        <h2 className="text-base font-semibold text-text-primary mb-4">Change password</h2>

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded bg-danger-subtle border border-danger/20 text-danger-text text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-3 py-2.5 rounded bg-success-subtle border border-success/20 text-success-text text-sm">
            {success}
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
      </section>

      {/* Danger zone */}
      <section className="bg-bg-surface border border-danger/20 rounded-lg p-6">
        <h2 className="text-base font-semibold text-danger-text mb-1">Danger zone</h2>
        <p className="text-sm text-text-muted mb-4">You will need to sign in again to regain access.</p>
        <Button variant="danger" size="md" icon={LogOut} onClick={logout}>
          Sign out
        </Button>
      </section>
    </div>
  );
}
