import type { Metadata } from 'next';
import { Container } from '@/components/marketing/Container';
import { Card } from '@/components/ui';
import { LogoIcon } from '@/components/brand/Logo';

export const metadata: Metadata = {
  title: 'About',
  description: 'Leinaflow is the AI Operating System for Creators, a product of Cloudivo.',
  openGraph: {
    title: 'About · Leinaflow',
    description: 'Leinaflow is the AI Operating System for Creators, a product of Cloudivo.',
    type: 'website',
    siteName: 'Leinaflow',
  },
};

export default function AboutPage() {
  return (
    <>
      <section className="pt-16 pb-14 sm:pt-24 sm:pb-20">
        <Container className="max-w-3xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-text-primary">
            About <span className="text-gradient-primary">Leinaflow</span>
          </h1>
          <p className="mt-6 text-lg text-text-secondary leading-relaxed">
            Leinaflow is the AI Operating System for Creators — a single platform for managing creators,
            media, AI workflows, and teams, built for agencies that have outgrown a patchwork of tools.
          </p>
        </Container>
      </section>

      <section className="pb-20">
        <Container className="max-w-3xl">
          <Card variant="elevated" padding="lg">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">Our mission</h2>
            <p className="mt-3 text-text-secondary leading-relaxed">
              The AI Operating System for Creators. We believe agencies shouldn&apos;t need a dozen
              disconnected tools to manage their creators, content, and teams — Leinaflow brings that work
              into one intelligent, secure workspace.
            </p>
          </Card>
        </Container>
      </section>

      <section className="pb-24">
        <Container className="max-w-3xl">
          <div className="flex flex-col sm:flex-row items-start gap-6 rounded-2xl border border-bg-border bg-bg-surface p-8">
            <LogoIcon size="lg" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-text-primary">A product of Cloudivo</h2>
              <p className="mt-3 text-text-secondary leading-relaxed">
                Leinaflow is built and operated by Cloudivo. Cloudivo builds intelligent platforms — software
                that puts AI to work as core infrastructure, not an add-on — and Leinaflow is Cloudivo&apos;s
                platform for the creator economy.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
