import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'white' | 'outline-white';
type Size = 'sm' | 'md' | 'lg';

interface ButtonLinkProps {
  href: string;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  children: ReactNode;
  className?: string;
}

// Mirrors @/components/ui/Button's class construction for cases that need a
// <Link> styled as a button (nav CTAs, hero CTAs, pricing cards) — matches
// the same pattern EmptyState.tsx already uses for its href-based action,
// centralized here instead of repeating the class strings on every page.
// Primary gets a bit more weight on hover (lift + the existing glow-primary
// shadow token) since it's the one button on the page that should feel like
// the obvious next step. Every other variant keeps the plain color-only
// hover it already had.
const variantClasses: Record<Variant, string> = {
  primary:
    'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 hover:-translate-y-0.5 hover:shadow-glow-primary active:translate-y-0',
  secondary: 'bg-bg-surface border border-bg-border text-text-primary hover:bg-bg-overlay active:bg-bg-subtle',
  ghost: 'text-text-secondary hover:bg-bg-subtle hover:text-text-primary active:bg-bg-overlay',
  // For CTAs placed on a solid gradient-brand surface (e.g. the highlighted pricing card).
  white: 'bg-white text-violet-700 hover:bg-white/90 active:bg-white/80 hover:-translate-y-0.5',
  'outline-white': 'bg-transparent border border-white/30 text-white hover:bg-white/10 active:bg-white/15',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-7 px-3 text-xs gap-1.5',
  md: 'h-8 px-3.5 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2',
};

const iconSizes: Record<Size, number> = { sm: 13, md: 14, lg: 17 };

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  children,
  className = '',
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={[
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {Icon && <Icon size={iconSizes[size]} className="shrink-0" />}
      {children}
      {IconRight && <IconRight size={iconSizes[size]} className="shrink-0" />}
    </Link>
  );
}
