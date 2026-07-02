'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   Variant;
  size?:      Size;
  loading?:   boolean;
  icon?:      LucideIcon;
  iconRight?: LucideIcon;
  children?:  ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 ' +
    'disabled:bg-violet-600/40 disabled:cursor-not-allowed',
  secondary:
    'bg-bg-surface border border-bg-border text-text-primary hover:bg-bg-overlay ' +
    'active:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed',
  ghost:
    'text-text-secondary hover:bg-bg-subtle hover:text-text-primary ' +
    'active:bg-bg-overlay disabled:opacity-40 disabled:cursor-not-allowed',
  danger:
    'bg-danger/10 text-danger-text border border-danger/20 hover:bg-danger/20 ' +
    'active:bg-danger/30 disabled:opacity-40 disabled:cursor-not-allowed',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-7 px-3 text-xs gap-1.5',
  md: 'h-8 px-3.5 text-sm gap-2',
  lg: 'h-10 px-5 text-sm gap-2',
};

const iconSizes: Record<Size, number> = { sm: 13, md: 14, lg: 15 };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, icon: Icon, iconRight: IconRight, children, className = '', disabled, ...props }, ref) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        {...props}
      >
        {loading ? (
          <Loader2 size={iconSizes[size]} className="animate-spin shrink-0" />
        ) : Icon ? (
          <Icon size={iconSizes[size]} className="shrink-0" />
        ) : null}
        {children}
        {!loading && IconRight && (
          <IconRight size={iconSizes[size]} className="shrink-0" />
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
