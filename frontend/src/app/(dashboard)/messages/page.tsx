'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { EmptyState } from '@/components/ui';
import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  return (
    <div className="bg-bg-surface border border-bg-border rounded-lg">
      <EmptyState
        icon={MessageSquare}
        title="No messages yet"
        description="Messages from your fans will appear here once your creators are connected."
        action={{ label: 'Connect a creator', onClick: () => router.push('/creators') }}
        size="lg"
      />
    </div>
  );
}
