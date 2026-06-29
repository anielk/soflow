'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { EmptyState } from '@/components/ui';
import { MessageSquare, Search } from 'lucide-react';

export default function MessagesPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Messages</h1>
        <p className="mt-1 text-sm text-text-muted">
          Fan messages across all connected creators.
        </p>
      </div>

      {/* Inbox shell */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden flex min-h-[520px]">
        {/* Left pane: conversation list — visible on md+ */}
        <div className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-bg-border/40">
          {/* Search bar */}
          <div className="p-3 border-b border-bg-border/40 shrink-0">
            <div className="flex items-center gap-2 px-3 h-8 bg-bg-subtle rounded border border-bg-border/60 text-text-muted">
              <Search size={12} className="shrink-0" />
              <span className="text-xs text-text-disabled">Search conversations…</span>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center px-3 py-2 gap-1 border-b border-bg-border/40 shrink-0">
            {['All', 'Unread', 'PPV'].map((tab, i) => (
              <button
                key={tab}
                type="button"
                className={[
                  'px-2.5 py-1 rounded text-xs font-medium transition-colors duration-150',
                  i === 0
                    ? 'bg-violet-600/15 text-violet-400'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-subtle',
                ].join(' ')}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Empty conversation list */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="text-xs text-text-disabled">No conversations yet</p>
          </div>
        </div>

        {/* Right pane: message view */}
        <div className="flex-1 flex flex-col">
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="Messages from your fans will appear here once your creators are connected to a platform."
            action={{ label: 'Connect a creator', href: '/creators' }}
            size="lg"
          />
        </div>
      </div>
    </div>
  );
}
