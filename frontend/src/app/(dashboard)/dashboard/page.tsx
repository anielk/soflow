'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { ComingSoonNotice } from '@/components/ui';
import { QuickActionsRow, OnboardingChecklist } from '@/components/dashboard';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* First-run onboarding checklist — renders nothing once complete or dismissed. Real, DB-backed. */}
      <OnboardingChecklist />

      {/* Quick actions — real navigation shortcuts, not data. */}
      <QuickActionsRow />

      {/*
        Revenue/activity/scheduled-posts/creator-goals widgets used to render
        here, backed by a hook that defaulted to fabricated mock numbers
        unless an env var was explicitly set to disable it. The backend
        endpoint behind the "real" path only ever returned hardcoded zeros,
        so there was no honest data to show either way. Removed rather than
        left showing fake or meaningless-zero numbers.
      */}
      <ComingSoonNotice
        feature="Revenue & activity dashboard"
        description="Revenue, activity, scheduled posts, and creator-goal widgets aren't backed by real data yet — they previously showed fabricated numbers and have been removed rather than left misleading."
      />
    </div>
  );
}
