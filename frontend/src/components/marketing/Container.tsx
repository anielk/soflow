import type { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  /** 'wide' is reserved for the one element on the page that should feel
   * more dominant than body copy — currently just the dashboard mockup. */
  size?: 'default' | 'wide';
}

const MAX_WIDTH: Record<NonNullable<ContainerProps['size']>, string> = {
  default: 'max-w-6xl',
  wide: 'max-w-[1240px]',
};

export function Container({ children, className = '', size = 'default' }: ContainerProps) {
  return <div className={[MAX_WIDTH[size], 'mx-auto px-4 sm:px-6 lg:px-8', className].join(' ')}>{children}</div>;
}
