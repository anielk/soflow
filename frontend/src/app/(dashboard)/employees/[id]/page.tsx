'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Avatar, Badge, EmptyState } from '@/components/ui';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';
import { listMembers } from '@/lib/workspace';
import type { WorkspaceMemberRecord } from '@/types/workspace';

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super admin',
  OWNER: 'Owner',
  MANAGER: 'Manager',
  USER: 'Member',
};

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [member,  setMember]  = useState<WorkspaceMemberRecord | null | undefined>(undefined);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    if (!params?.id) return;
    listMembers()
      .then((members) => setMember(members.find((m) => m.id === params.id) ?? null))
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load team member'));
  }, [router, params?.id]);

  if (loadError) {
    return (
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <EmptyState icon={Users} title="Couldn't load team member" description={loadError} size="lg" />
      </div>
    );
  }

  if (member === undefined) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={20} className="animate-spin text-text-muted" />
      </div>
    );
  }

  if (member === null) {
    return (
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <EmptyState
          icon={Users}
          title="Team member not found"
          description="This person is no longer a member of this workspace."
          action={{ label: 'Back to team', href: '/employees' }}
          size="lg"
        />
      </div>
    );
  }

  const displayName = member.user.name ?? member.user.email;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <button
          type="button"
          onClick={() => router.push('/employees')}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft size={13} />
          All team members
        </button>

        <div className="flex items-center gap-4">
          <Avatar name={displayName} size="xl" />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold text-text-primary">{displayName}</h1>
              <Badge variant="violet" size="sm">{ROLE_LABEL[member.role] ?? member.role}</Badge>
            </div>
            <p className="text-sm text-text-muted mt-0.5">{member.user.email}</p>
          </div>
        </div>
      </div>

      {/* Account details — the only fields that are actually real today */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden max-w-xl">
        <div className="px-4 pt-4 pb-3 border-b border-bg-border/40">
          <h3 className="text-sm font-semibold text-text-primary">Account details</h3>
        </div>
        <dl className="divide-y divide-bg-border/40">
          {[
            { label: 'Email', value: member.user.email },
            { label: 'Role', value: ROLE_LABEL[member.role] ?? member.role },
            {
              label: 'Joined',
              value: new Date(member.joinedAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }),
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-4 px-4 py-2.5">
              <dt className="text-xs text-text-muted w-24 shrink-0 pt-0.5">{label}</dt>
              <dd className="text-sm text-text-primary">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="text-xs text-text-muted max-w-xl">
        Performance tracking, creator assignment, shift scheduling, permission management, and removing a member
        aren&apos;t implemented yet.
      </p>
    </div>
  );
}
