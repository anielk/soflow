'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Badge, Button } from '@/components/ui';
import { Zap, MessageSquare, Calendar, BarChart3, Star, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Message suggestions',
    description: 'AI drafts personalized responses based on fan history and conversation context. Never stare at a blank message box again.',
    status: 'Available in beta',
    color: '#8B5CF6',
  },
  {
    icon: Calendar,
    title: 'Post scheduling optimizer',
    description: 'Analyzes your audience\'s activity patterns to recommend the best times to post for maximum engagement.',
    status: 'Coming soon',
    color: '#3B82F6',
  },
  {
    icon: BarChart3,
    title: 'Revenue insights',
    description: 'Proactively identifies which fans are most likely to tip, buy PPV, or churn — so you can act before it happens.',
    status: 'Coming soon',
    color: '#10B981',
  },
  {
    icon: Star,
    title: 'Content ideas',
    description: 'Generates content ideas tailored to your niche and posting history, including captions, themes and PPV concepts.',
    status: 'Coming soon',
    color: '#F59E0B',
  },
];

const EXAMPLE_SUGGESTIONS = [
  { fan: 'MikeR', last: 'Tipped €50 3 days ago', suggestion: 'Great time to send a personal thank-you and mention your new PPV drop.', action: 'Use suggestion' },
  { fan: 'TomB',  last: 'Subscriber for 4 months, no tips', suggestion: 'Long-term fans without tips are 3x more likely to convert on a personal message.', action: 'Use suggestion' },
  { fan: 'ChrisK', last: 'Last active 18 days ago', suggestion: 'Fan is at churn risk. Send a re-engagement message with a limited-time offer.', action: 'Use suggestion' },
];

export default function AICopilotPage() {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl font-semibold text-text-primary">AI Copilot</h1>
            <Badge variant="violet" size="sm">Beta</Badge>
          </div>
          <p className="text-sm text-text-muted">
            Intelligent suggestions and automation to help you earn more with less effort
          </p>
        </div>
        <Button variant="primary" size="md" icon={Zap}>
          Enable Copilot
        </Button>
      </div>

      {/* Hero promo */}
      <div className="bg-gradient-to-br from-violet-600/10 via-violet-600/5 to-bg-surface border border-violet-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
            <Zap size={20} className="text-violet-400" />
          </div>
          <div>
            <p className="font-semibold text-text-primary">Leinaflow Copilot is in early access</p>
            <p className="text-xs text-text-muted">Available for Pro agencies · Powered by Claude</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          Copilot analyzes your fan data in real-time and suggests the right message, at the right time,
          for the right fan. Agencies using Copilot see an average of 23% more revenue per creator.
        </p>
        <Button variant="primary" size="md">
          Request early access
        </Button>
      </div>

      {/* Features grid */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-[0.06em] text-[11px]">
          Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, description, status, color }) => (
            <div key={title} className="bg-bg-surface border border-bg-border/60 rounded-xl p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0"
                  style={{ color, background: `${color}18` }}
                >
                  {status}
                </span>
              </div>
              <p className="text-sm font-semibold text-text-primary mb-1.5">{title}</p>
              <p className="text-xs text-text-muted leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Example suggestions */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-bg-border/40 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-text-primary">Example suggestions</h2>
          <Badge variant="default" size="sm">Preview</Badge>
        </div>
        <div className="divide-y divide-bg-border/40">
          {EXAMPLE_SUGGESTIONS.map(({ fan, last, suggestion, action }) => (
            <div key={fan} className="px-4 py-4 hover:bg-bg-subtle/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-text-primary">{fan}</span>
                    <span className="text-xs text-text-muted">· {last}</span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{suggestion}</p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors shrink-0"
                >
                  {action}
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-bg-border/40 bg-bg-subtle/20">
          <p className="text-xs text-text-disabled">
            Suggestions shown above are illustrative. Enable Copilot to see real-time suggestions based on your fans.
          </p>
        </div>
      </div>
    </div>
  );
}
