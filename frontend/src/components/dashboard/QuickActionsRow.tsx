'use client';

import { useRouter } from 'next/navigation';
import {
  PenSquare,
  MessageSquare,
  Users,
  CalendarPlus,
  Sparkles,
  ListFilter,
  type LucideIcon,
} from 'lucide-react';

interface QuickAction {
  id:          string;
  label:       string;
  description: string;
  icon:        LucideIcon;
  iconBg:      string;
  iconColor:   string;
  href:        string;
}

const ACTIONS: QuickAction[] = [
  {
    id:          'new-post',
    label:       'New post',
    description: 'Publish to your feed',
    icon:        PenSquare,
    iconBg:      'rgba(139,92,246,0.14)',
    iconColor:   '#A78BFA',
    href:        '/of-manager/new-post',
  },
  {
    id:          'send-message',
    label:       'Send message',
    description: 'Mass or 1-on-1',
    icon:        MessageSquare,
    iconBg:      'rgba(236,72,153,0.14)',
    iconColor:   '#F472B6',
    href:        '/messages-pro',
  },
  {
    id:          'view-fans',
    label:       'View fans',
    description: 'Browse fan list',
    icon:        Users,
    iconBg:      'rgba(59,130,246,0.14)',
    iconColor:   '#60A5FA',
    href:        '/fans',
  },
  {
    id:          'schedule-post',
    label:       'Schedule post',
    description: 'Plan upcoming content',
    icon:        CalendarPlus,
    iconBg:      'rgba(245,158,11,0.14)',
    iconColor:   '#FCD34D',
    href:        '/of-manager/queue',
  },
  {
    id:          'ai-copilot',
    label:       'AI Copilot',
    description: 'Generate captions',
    icon:        Sparkles,
    iconBg:      'rgba(16,185,129,0.14)',
    iconColor:   '#34D399',
    href:        '/growth/ai-copilot',
  },
  {
    id:          'smart-lists',
    label:       'Smart lists',
    description: 'Segment your fans',
    icon:        ListFilter,
    iconBg:      'rgba(99,102,241,0.14)',
    iconColor:   '#818CF8',
    href:        '/growth/smart-lists',
  },
];

export function QuickActionsRow() {
  const router = useRouter();

  return (
    <div>
      <h3 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] mb-3">
        Quick actions
      </h3>
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => router.push(action.href)}
              className="flex items-center gap-3 px-4 py-3 bg-bg-surface border border-bg-border/60 rounded-xl hover:border-bg-muted hover:bg-bg-overlay hover:-translate-y-px transition-all duration-150 shrink-0 text-left group active:translate-y-0"
            >
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-[1.08]"
                style={{ backgroundColor: action.iconBg }}
              >
                <Icon size={15} style={{ color: action.iconColor }} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-text-primary whitespace-nowrap leading-none mb-1">
                  {action.label}
                </span>
                <span className="block text-[11px] text-text-muted whitespace-nowrap">
                  {action.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
