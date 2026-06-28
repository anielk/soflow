'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { EmptyState } from '@/components/ui';
import { Users } from 'lucide-react';

export default function FansPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  return (
    <div className="bg-bg-surface border border-bg-border rounded-lg">
      <EmptyState
        icon={Users}
        title="No fans yet"
        description="Fan data will appear here once your creators are connected and receiving subscribers."
        action={{ label: 'Set up a creator', onClick: () => router.push('/creators') }}
        size="lg"
      />
    </div>
  );
}
