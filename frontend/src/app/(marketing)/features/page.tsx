import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/marketing/Container';
import { ButtonLink } from '@/components/marketing/ButtonLink';
import { FeatureCard } from '@/components/marketing/FeatureCard';
import { FEATURES } from '@/components/marketing/data';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Everything Leinaflow gives creator agencies: content management, a secure media library, analytics, AI assistance, workspace management, and more.',
  openGraph: {
    title: 'Features · Leinaflow',
    description: 'Everything Leinaflow gives creator agencies to run their business from one platform.',
    type: 'website',
    siteName: 'Leinaflow',
  },
};

export default function FeaturesPage() {
  return (
    <>
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-16">
        <Container className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-text-primary">
            One platform, <span className="text-gradient-primary">every capability</span>
          </h1>
          <p className="mt-5 text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Leinaflow brings content, media, analytics, AI, and team management together — built for how
            creator agencies actually run day to day.
          </p>
        </Container>
      </section>

      <section className="pb-20">
        <Container>
          <h2 className="sr-only">All features</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">See it running in your workflow</h2>
          <p className="mt-3 text-text-muted">Start a free trial or book a demo with your own use case.</p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <ButtonLink href="/register" size="lg" iconRight={ArrowRight}>
              Start Free Trial
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary" size="lg">
              Book a Demo
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
