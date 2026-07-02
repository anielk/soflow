'use client';

import { useId } from 'react';

const ICON_SIZES = { sm: 24, md: 28, lg: 40 } as const;

interface LogoIconProps {
  size?:      keyof typeof ICON_SIZES | number;
  className?: string;
}

// The official Leinaflow mark — a gradient chip (brand.primary -> brand.secondary) with the
// white "L + dot" glyph. Source SVGs live in /public/brand; keep this in sync with those.
export function LogoIcon({ size = 'md', className = '' }: LogoIconProps) {
  const px = typeof size === 'number' ? size : ICON_SIZES[size];
  const gradientId = useId();

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      fill="none"
      className={['shrink-0', className].join(' ')}
      role="img"
      aria-label="Leinaflow"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7" fill={`url(#${gradientId})`} />
      <rect x="9" y="5" width="7" height="17" rx="3.5" fill="#FFFFFF" />
      <circle cx="20" cy="22.5" r="4.5" fill="#FFFFFF" />
    </svg>
  );
}

interface LogoProps {
  iconSize?:      LogoIconProps['size'];
  textClassName?: string;
  className?:     string;
}

// Full lockup: icon + "Leinaflow" wordmark. Callers that already own their own wordmark
// styling should use <LogoIcon /> directly instead, to avoid fighting this component's defaults.
export function Logo({ iconSize = 'md', textClassName = 'text-text-primary', className = '' }: LogoProps) {
  return (
    <span className={['inline-flex items-center gap-2', className].join(' ')}>
      <LogoIcon size={iconSize} />
      <span className={['font-bold tracking-tight', textClassName].join(' ')}>Leinaflow</span>
    </span>
  );
}
