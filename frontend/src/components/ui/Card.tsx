import type { HTMLAttributes, ReactNode } from 'react';

type Variant = 'default' | 'elevated' | 'gradient';
type Padding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?:  Variant;
  padding?:  Padding;
  children:  ReactNode;
}

const variantClasses: Record<Variant, string> = {
  default:  'bg-bg-surface border border-bg-border/60 shadow-soft-sm',
  elevated: 'bg-bg-surface border border-bg-border/60 shadow-soft hover:shadow-soft-lg transition-shadow duration-200',
  gradient: 'bg-gradient-primary border border-transparent text-white shadow-soft',
};

const paddingClasses: Record<Padding, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-7',
};

export function Card({ variant = 'default', padding = 'md', children, className = '', ...props }: CardProps) {
  return (
    <div
      className={[
        'rounded-2xl',
        variantClasses[variant],
        paddingClasses[padding],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
