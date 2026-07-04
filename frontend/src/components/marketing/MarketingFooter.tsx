import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { Container } from './Container';

const PRODUCT_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Roadmap', href: '/roadmap' },
];

const COMPANY_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Login', href: '/login' },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-bg-border">
      <Container className="py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-2">
            <Logo iconSize="md" />
            <p className="mt-3 text-sm text-text-muted max-w-xs">
              The AI Operating System for Creators — manage creators, media, AI workflows and teams
              from one intelligent platform.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-disabled mb-3">Product</h2>
            <ul className="flex flex-col gap-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-disabled mb-3">Company</h2>
            <ul className="flex flex-col gap-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-bg-border/60 text-xs text-text-disabled">
          &copy; {new Date().getFullYear()} Leinaflow &middot; A product of{' '}
          <span className="text-text-muted">Cloudivo</span>
        </div>
      </Container>
    </footer>
  );
}
