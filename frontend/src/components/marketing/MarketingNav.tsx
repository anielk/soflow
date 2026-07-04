'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ButtonLink } from './ButtonLink';
import { isAuthenticated } from '@/lib/auth';

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Roadmap', href: '/roadmap' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 bg-bg-base/80 backdrop-blur border-b border-bg-border">
      <nav aria-label="Main" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="shrink-0" aria-label="Leinaflow home">
          <Logo iconSize="md" />
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            href={authed ? '/dashboard' : '/login'}
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            {authed ? 'Dashboard' : 'Login'}
          </Link>
          <ButtonLink href="/contact" variant="primary" size="md">
            Request a Demo
          </ButtonLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="marketing-mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors duration-150"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div id="marketing-mobile-menu" className="lg:hidden border-t border-bg-border bg-bg-base animate-fade-in">
          <div className="px-4 sm:px-6 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors duration-150"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={authed ? '/dashboard' : '/login'}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors duration-150"
            >
              {authed ? 'Dashboard' : 'Login'}
            </Link>
            <ButtonLink href="/contact" variant="primary" size="md" className="w-full mt-2">
              Request a Demo
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}
