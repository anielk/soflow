'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock, CheckCircle2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { LogoIcon } from '@/components/brand/Logo';
import { resetPassword } from '@/lib/api';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}

function ResetPasswordPageInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (newPassword.length < 4) { setError('Password must be at least 4 characters'); return; }
    setLoading(true);
    try {
      await resetPassword({ token, newPassword });
      setDone(true);
    } catch {
      setError('This reset link is invalid or has expired. Request a new one.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-2 mb-8 justify-center">
        <LogoIcon size={32} />
        <span className="text-lg font-semibold tracking-tight text-text-primary">Leinaflow</span>
      </div>

      <div className="bg-bg-surface border border-bg-border rounded-xl p-7">
        <h1 className="text-xl font-semibold text-text-primary mb-1">Reset password</h1>
        <p className="text-sm text-text-muted mb-6">Choose a new password for your account.</p>

        {done ? (
          <div className="flex items-start gap-3 bg-success-subtle border border-success/20 rounded-lg p-4">
            <CheckCircle2 size={18} className="text-success-text shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-text-primary font-medium">Password reset</p>
              <p className="text-sm text-text-muted mt-0.5">You can now sign in with your new password.</p>
            </div>
          </div>
        ) : !token ? (
          <div className="px-3 py-2.5 rounded bg-danger-subtle border border-danger/20 text-danger-text text-sm">
            This reset link is missing its token. Request a new one from the forgot password page.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="px-3 py-2.5 rounded bg-danger-subtle border border-danger/20 text-danger-text text-sm">
                {error}
              </div>
            )}
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leadingIcon={Lock}
              hint="Minimum 4 characters"
              autoComplete="new-password"
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leadingIcon={Lock}
              autoComplete="new-password"
              required
            />
            <Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
              Reset password
            </Button>
          </form>
        )}

        <p className="text-sm text-text-muted text-center mt-6">
          <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>

      <p className="text-xs text-text-disabled text-center mt-6">
        Leinaflow &middot; A product of Cloudivo
      </p>
    </div>
  );
}
