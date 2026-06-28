import type { ReactNode } from 'react';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'violet';
type Size    = 'sm' | 'md';

interface BadgeProps {
  variant?:  Variant;
  size?:     Size;
  children:  ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-bg-subtle text-text-secondary',
  success: 'bg-success-subtle text-success-text',
  warning: 'bg-warning-subtle text-warning-text',
  danger:  'bg-danger-subtle text-danger-text',
  violet:  'bg-violet-600/15 text-violet-400',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-2xs px-1.5 py-0.5 min-w-[18px]',
  md: 'text-xs  px-2    py-0.5 min-w-[22px]',
};

export function Badge({ variant = 'default', size = 'md', children, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center justify-center rounded-full font-medium tabular-nums',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
