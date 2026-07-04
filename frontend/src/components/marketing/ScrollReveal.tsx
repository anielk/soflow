'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
}

// A one-shot, native fade-in-on-scroll — no animation library, just
// IntersectionObserver. Reveals once and stays visible; never re-triggers on
// scroll-back.
//
// prefers-reduced-motion is checked in useLayoutEffect (not useEffect) so the
// "skip the animation" decision lands before the browser paints — otherwise
// content briefly renders at opacity-0 and still visibly transitions to
// opacity-100 a moment later, which is exactly the motion this setting asks
// to avoid, just delayed instead of removed.
export function ScrollReveal({ children, className = '' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(false);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSkipAnimation(true);
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -80px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (skipAnimation) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={[
        'transition-all duration-700 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
