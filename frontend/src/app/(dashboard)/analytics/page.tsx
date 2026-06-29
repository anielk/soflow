'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { EmptyState, Badge } from '@/components/ui';
import { Users, UserCheck, FileText, Activity, BarChart3 } from 'lucide-react';

const REPORT_TYPES = [
  {
    icon:        Users,
    label:       'Creator reports',
    description: 'Revenue, engagement, subscriber growth and churn per creator.',
    color:       '#8B5CF6',
  },
  {
    icon:        UserCheck,
    label:       'Employee reports',
    description: 'Shift performance, message volume, and revenue attribution per chatter.',
    color:       '#3B82F6',
  },
  {
    icon:        FileText,
    label:       'Fan reports',
    description: 'Fan lifetime value, spend history, and behavioral segments.',
    color:       '#EC4899',
  },
  {
    icon:        Activity,
    label:       'Message dashboard',
    description: 'Response rates, message conversion, and PPV performance by creator.',
    color:       '#10B981',
  },
] as const;

export default function AnalyticsPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Analytics</h1>
        <p className="mt-1 text-sm text-text-muted">
          Deep insights into creators, employees, fans, and message performance.
        </p>
      </div>

      {/* Report type tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORT_TYPES.map(({ icon: Icon, label, description, color }) => (
          <div
            key={label}
            className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 flex gap-4"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${color}18` }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-text-primary">{label}</span>
                <Badge variant="default" size="sm">In development</Badge>
              </div>
              <p className="mt-1 text-xs text-text-muted leading-relaxed">{description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Unlock CTA */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <EmptyState
          icon={BarChart3}
          title="Connect a creator to unlock analytics"
          description="Analytics become available once your first creator account is connected. Reports update daily."
          action={{ label: 'Manage creators', href: '/creators' }}
          size="lg"
        />
      </div>
    </div>
  );
}
