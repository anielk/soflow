'use client';

import { useState, useRef, type ReactNode, type CSSProperties } from 'react';

interface TooltipProps {
  content:   ReactNode;
  children:  ReactNode;
  side?:     'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const sideStyles: Record<string, CSSProperties> = {
  top:    { bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' },
  bottom: { top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' },
  left:   { right: 'calc(100% + 6px)', top: '50%', transform: 'translateY(-50%)' },
  right:  { left: 'calc(100% + 6px)', top: '50%', transform: 'translateY(-50%)' },
};

export function Tooltip({ content, children, side = 'top', className = '' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    timer.current = setTimeout(() => setVisible(true), 400);
  }
  function hide() {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  }

  return (
    <span
      className={['relative inline-flex', className].join(' ')}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className="absolute z-50 pointer-events-none whitespace-nowrap text-xs text-text-primary bg-bg-overlay border border-bg-border rounded px-2 py-1 shadow-dropdown animate-fade-in"
          style={sideStyles[side]}
        >
          {content}
        </span>
      )}
    </span>
  );
}
