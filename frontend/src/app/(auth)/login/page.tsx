'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Layers } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { loginUser } from '@/lib/api';
import { setAuthToken } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await loginUser({ email, password });
      if (response?.access_token) {
        setAuthToken(response.access_token);
        router.push('/dashboard');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 justify-center">
        <div className="w-8 h-8 rounded-md bg-violet-600 flex items-center justify-center">
          <Layers size={16} className="text-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-text-primary">Leinaflow</span>
      </div>

      <div className="bg-bg-surface border border-bg-border rounded-xl p-7">
        <h1 className="text-xl font-semibold text-text-primary mb-1">Sign in</h1>
        <p className="text-sm text-text-muted mb-6">Welcome back to your creator platform</p>

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded bg-danger-subtle border border-danger/20 text-danger-text text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@agency.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leadingIcon={Mail}
            autoComplete="email"
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leadingIcon={Lock}
            autoComplete="current-password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full mt-1"
          >
            Sign in
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-text-muted">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
