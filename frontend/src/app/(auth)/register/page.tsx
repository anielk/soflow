'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Layers } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { registerUser } from '@/lib/api';

export default function RegisterPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await registerUser({ email, password, username });
      router.push('/login');
    } catch {
      setError('Registration failed. Please try again.');
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
        <span className="text-lg font-semibold tracking-tight text-text-primary">Soflow</span>
      </div>

      <div className="bg-bg-surface border border-bg-border rounded-xl p-7">
        <h1 className="text-xl font-semibold text-text-primary mb-1">Create account</h1>
        <p className="text-sm text-text-muted mb-6">Start managing your creators today</p>

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded bg-danger-subtle border border-danger/20 text-danger-text text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Username"
            type="text"
            placeholder="youragency"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            leadingIcon={User}
            autoComplete="username"
            required
          />
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
            autoComplete="new-password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full mt-1"
          >
            Create account
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
