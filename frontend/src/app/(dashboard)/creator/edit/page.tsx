'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { apiGet, apiPut } from '@/lib/api';
import { Button, Input, Textarea } from '@/components/ui';
import { CheckCircle2 } from 'lucide-react';

interface CreatorProfile {
  name:        string;
  bio:         string;
  avatarUrl:   string;
  website:     string;
  socialLinks: Record<string, string>;
}

export default function CreatorEditPage() {
  const [profile, setProfile] = useState<CreatorProfile>({
    name: '', bio: '', avatarUrl: '', website: '', socialLinks: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    apiGet<CreatorProfile>('/users/profile')
      .then((p) => {
        setProfile({
          name:        p.name        ?? '',
          bio:         p.bio         ?? '',
          avatarUrl:   p.avatarUrl   ?? '',
          website:     p.website     ?? '',
          socialLinks: p.socialLinks ?? {},
        });
        setLoading(false);
      })
      .catch(() => { setError('Failed to load profile'); setLoading(false); });
  }, [router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await apiPut('/users/profile', profile);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-text-muted text-sm">
        Loading profile…
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-bg-surface border border-bg-border rounded-lg p-6">
        <h2 className="text-base font-semibold text-text-primary mb-5">Edit creator profile</h2>

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded bg-danger-subtle border border-danger/20 text-danger-text text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-3 py-2.5 rounded bg-success-subtle border border-success/20 text-success-text text-sm flex items-center gap-2">
            <CheckCircle2 size={14} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Display name"
            type="text"
            name="name"
            value={profile.name}
            onChange={handleChange}
            placeholder="Your creator name"
          />
          <Textarea
            label="Bio"
            name="bio"
            rows={4}
            value={profile.bio}
            onChange={handleChange}
            placeholder="Tell your audience about yourself…"
          />
          <Input
            label="Avatar URL"
            type="url"
            name="avatarUrl"
            value={profile.avatarUrl}
            onChange={handleChange}
            placeholder="https://example.com/avatar.jpg"
          />
          <Input
            label="Website"
            type="url"
            name="website"
            value={profile.website}
            onChange={handleChange}
            placeholder="https://yourwebsite.com"
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="md" loading={saving}>
              Save profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
