import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon:        LucideIcon;
  title:       string;
  description: string;
  action?:
    | { label: string; onClick: () => void; href?: never }
    | { label: string; href: string; onClick?: never };
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: { wrap: 'py-8',  icon: 32, title: 'text-sm', desc: 'text-xs', gap: 'gap-2' },
  md: { wrap: 'py-12', icon: 40, title: 'text-base', desc: 'text-sm', gap: 'gap-3' },
  lg: { wrap: 'py-16', icon: 48, title: 'text-lg', desc: 'text-base', gap: 'gap-4' },
} as const;

export function EmptyState({ icon: Icon, title, description, action, size = 'md' }: EmptyStateProps) {
  const s = sizeClasses[size];
  return (
    <div className={['flex flex-col items-center text-center', s.wrap, s.gap].join(' ')}>
      <div className="rounded-xl bg-bg-subtle p-3 text-text-muted">
        <Icon size={s.icon} strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-1 max-w-xs">
        <p className={['font-medium text-text-primary', s.title].join(' ')}>{title}</p>
        <p className={['text-text-muted', s.desc].join(' ')}>{description}</p>
      </div>
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center justify-center h-8 px-3.5 text-sm font-medium rounded bg-violet-600 text-white hover:bg-violet-700 transition-colors duration-150"
          >
            {action.label}
          </Link>
        ) : (
          <Button variant="primary" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}
