'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { apiGet, apiPut } from '@/lib/api';
import { Button, Input, Textarea, Avatar, Skeleton } from '@/components/ui';
import { CheckCircle2 } from 'lucide-react';

interface CreatorProfile {
  name:        string;
  bio:         string;
  avatarUrl:   string;
  website:     string;
  socialLinks: Record<string, string>;
}

const SOCIAL_FIELDS = [
  { key: 'twitter',   label: 'Twitter / X',  placeholder: 'https://x.com/yourhandle' },
  { key: 'instagram', label: 'Instagram',     placeholder: 'https://instagram.com/yourhandle' },
  { key: 'tiktok',    label: 'TikTok',        placeholder: 'https://tiktok.com/@yourhandle' },
] as const;

export default function CreatorEditPage() {
  const [profile, setProfile] = useState<CreatorProfile>({
    name: '', bio: '', avatarUrl: '', website: '', socialLinks: {},
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
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

  function handleSocialChange(key: string, value: string) {
    setProfile((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }));
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

  return (
    <div className="max-w-2xl space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Edit creator profile</h1>
        <p className="mt-1 text-sm text-text-muted">
          Update the public profile shown to fans on OnlyFans.
        </p>
      </div>

      {/* Profile preview card */}
      <section>
        <h2 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] mb-3">
          Preview
        </h2>
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 flex items-center gap-4">
          {loading ? (
            <>
              <Skeleton width={48} height={48} rounded="full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton width="38%" height={14} className="rounded" />
                <Skeleton width="55%" height={12} className="rounded" />
              </div>
            </>
          ) : (
            <>
              <Avatar name={profile.name || 'Creator'} size="xl" />
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {profile.name || 'Creator name'}
                </p>
                <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                  {profile.bio || 'No bio yet'}
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Basic info */}
      <section>
        <h2 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] mb-3">
          Basic information
        </h2>
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton width={80} height={11} className="rounded" />
                  <Skeleton width="100%" height={32} className="rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
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

              <form id="creator-form" onSubmit={handleSubmit} className="space-y-4">
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
                  label="Website"
                  type="url"
                  name="website"
                  value={profile.website}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.com"
                />
              </form>
            </>
          )}
        </div>
      </section>

      {/* Social links */}
      <section>
        <h2 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] mb-3">
          Social links
        </h2>
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton width={72} height={11} className="rounded" />
                  <Skeleton width="100%" height={32} className="rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
                <Input
                  key={key}
                  label={label}
                  type="url"
                  value={profile.socialLinks[key] ?? ''}
                  onChange={(e) => handleSocialChange(key, e.target.value)}
                  placeholder={placeholder}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Submit */}
      {!loading && (
        <div className="flex justify-end">
          <Button type="submit" form="creator-form" variant="primary" size="md" loading={saving}>
            Save profile
          </Button>
        </div>
      )}
    </div>
  );
}
