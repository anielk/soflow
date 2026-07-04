import type { Metadata } from 'next';
import Link from 'next/link';
import { Info } from 'lucide-react';
import { Container } from '@/components/marketing/Container';
import { PricingCard } from '@/components/marketing/PricingCard';
import { PRICING_TIERS } from '@/components/marketing/data';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Leinaflow pricing tiers for individual creators, growing agencies, and enterprise teams.',
  openGraph: {
    title: 'Pricing · Leinaflow',
    description: 'Leinaflow pricing tiers for individual creators, growing agencies, and enterprise teams.',
    type: 'website',
    siteName: 'Leinaflow',
  },
};

export default function PricingPage() {
  return (
    <>
      <section className="pt-16 pb-10 sm:pt-24 sm:pb-14">
        <Container className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-text-primary">
            Simple, <span className="text-gradient-primary">agency-friendly</span> pricing
          </h1>
          <p className="mt-5 text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Plans that scale from a single creator to a full agency team.
          </p>
        </Container>
      </section>

      <section className="pb-6">
        <Container>
          <div className="flex items-start gap-3 rounded-xl border border-violet-600/20 bg-violet-600/10 px-5 py-4 max-w-2xl mx-auto">
            <Info size={18} className="text-violet-400 shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary">
              Pricing shown below is illustrative — final pricing is confirmed when you talk to our team.{' '}
              <Link href="/contact" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                Contact us for a custom quote
              </Link>
              .
            </p>
          </div>
        </Container>
      </section>

      <section className="pb-24 pt-8">
        <Container>
          <h2 className="sr-only">Pricing plans</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {PRICING_TIERS.map((tier) => (
              <PricingCard key={tier.name} {...tier} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
