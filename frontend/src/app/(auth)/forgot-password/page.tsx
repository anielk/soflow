'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, CheckCircle2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { LogoIcon } from '@/components/brand/Logo';
import { requestPasswordReset } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(email);
    } catch {
      // Intentionally ignored — the backend always returns success here so
      // this screen never reveals whether an account exists for the email.
    } finally {
      setSent(true);
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
        <h1 className="text-xl font-semibold text-text-primary mb-1">Forgot password</h1>
        <p className="text-sm text-text-muted mb-6">We&apos;ll email you a link to reset it.</p>

        {sent ? (
          <div className="flex items-start gap-3 bg-success-subtle border border-success/20 rounded-lg p-4">
            <CheckCircle2 size={18} className="text-success-text shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary">
              If an account exists for <span className="text-text-primary font-medium">{email}</span>, a reset link
              is on its way. Check your inbox.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leadingIcon={Mail}
              autoComplete="email"
              required
            />
            <Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
              Send reset link
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
