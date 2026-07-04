'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  X,
  Image as ImageIcon,
  UserPlus,
  UploadCloud,
  UsersRound,
  Bot,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { getOnboardingStatus } from '@/lib/workspace';
import { isSuperAdmin } from '@/lib/auth';
import type { OnboardingStatus } from '@/types/workspace';

const DISMISS_KEY = 'leinaflow_onboarding_dismissed';

interface ChecklistItem {
  id:          string;
  label:       string;
  description: string;
  icon:        LucideIcon;
  href:        string | null;
  done:        boolean;
  optional?:   boolean;
}

export function OnboardingChecklist() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  // Defaults to hidden so there is no flash of a card that immediately
  // disappears once we learn the user already dismissed it.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === 'true');
    getOnboardingStatus()
      .then(setStatus)
      .catch(() => undefined);
  }, []);

  if (!status || dismissed || status.allRequiredDone) return null;

  const items: ChecklistItem[] = [
    {
      id: 'logo',
      label: 'Upload your logo',
      description: 'Brand your workspace so your team recognizes it at a glance.',
      icon: ImageIcon,
      href: '/settings?category=branding',
      done: status.hasLogo,
    },
    {
      id: 'teammate',
      label: 'Add your first teammate',
      description: 'Bring a collaborator into your workspace.',
      icon: UserPlus,
      href: '/settings?category=users',
      done: status.hasTeammate,
    },
    {
      id: 'media',
      label: 'Upload your first media file',
      description: 'Add a photo or video to your Media Library.',
      icon: UploadCloud,
      href: '/creator-manager/vault',
      done: status.hasMedia,
    },
    {
      id: 'creator',
      label: 'Create your first creator',
      description: 'Add the creator your team will manage content for.',
      icon: UsersRound,
      href: '/creators',
      done: status.hasCreator,
    },
    {
      id: 'ai',
      label: 'Connect an AI provider',
      description: isSuperAdmin()
        ? 'Enable AI-powered workflows for your workspace.'
        : 'Ask a workspace admin to connect an AI provider.',
      icon: Bot,
      href: isSuperAdmin() ? '/admin/ai' : null,
      done: status.hasAiConnection,
      optional: true,
    },
  ];

  const requiredItems = items.filter((i) => !i.optional);
  const doneCount = requiredItems.filter((i) => i.done).length;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  }

  return (
    <div className="bg-bg-surface border border-bg-border/60 rounded-2xl shadow-soft overflow-hidden animate-fade-in">
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Get your workspace ready</h2>
          <p className="mt-1 text-sm text-text-muted">
            {doneCount} of {requiredItems.length} steps complete — finish these to unlock the full Leinaflow
            experience.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-text-muted hover:text-text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 rounded"
          aria-label="Dismiss checklist"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-5">
        <div className="h-1.5 bg-bg-overlay rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-primary transition-all duration-500"
            style={{ width: `${(doneCount / requiredItems.length) * 100}%` }}
          />
        </div>
      </div>

      <ul className="mt-4 divide-y divide-bg-border/40 border-t border-bg-border/40">
        {items.map((item) => {
          const Icon = item.icon;
          const content = (
            <>
              {item.done ? (
                <CheckCircle2 size={18} className="text-success-text shrink-0" />
              ) : (
                <Circle size={18} className="text-text-disabled shrink-0" />
              )}
              <div className="w-8 h-8 rounded-lg bg-violet-600/10 flex items-center justify-center shrink-0">
                <Icon size={15} className="text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={[
                      'text-sm font-medium',
                      item.done ? 'text-text-muted line-through' : 'text-text-primary',
                    ].join(' ')}
                  >
                    {item.label}
                  </p>
                  {item.optional && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-text-disabled bg-bg-subtle px-1.5 py-0.5 rounded shrink-0">
                      Optional
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">{item.description}</p>
              </div>
              {item.href && <ChevronRight size={16} className="text-text-disabled shrink-0" />}
            </>
          );

          return (
            <li key={item.id}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-bg-subtle/60 transition-colors duration-150 focus-visible:outline-none focus-visible:bg-bg-subtle/60"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-5 py-3.5 opacity-70">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
