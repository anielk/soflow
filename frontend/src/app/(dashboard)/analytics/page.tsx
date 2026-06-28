'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { EmptyState } from '@/components/ui';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  return (
    <div className="bg-bg-surface border border-bg-border rounded-lg">
      <EmptyState
        icon={BarChart3}
        title="Analytics coming soon"
        description="Detailed creator, employee, and fan reports are being built. Connect your first creator to unlock analytics."
        action={{ label: 'Manage creators', onClick: () => router.push('/creators') }}
        size="lg"
      />
    </div>
  );
}
