import type { Metadata } from 'next';
import { Briefcase, Calendar, Mail } from 'lucide-react';
import { Container } from '@/components/marketing/Container';
import { Card } from '@/components/ui';
import { DemoRequestForm } from '@/components/marketing/DemoRequestForm';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Leinaflow team for general questions, demo requests, or business inquiries.',
  openGraph: {
    title: 'Contact · Leinaflow',
    description: 'Get in touch with the Leinaflow team for general questions, demo requests, or business inquiries.',
    type: 'website',
    siteName: 'Leinaflow',
  },
};

export default function ContactPage() {
  return (
    <>
      <section className="pt-16 pb-14 sm:pt-24 sm:pb-20">
        <Container className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-text-primary">
            Let&apos;s <span className="text-gradient-primary">talk</span>
          </h1>
          <p className="mt-5 text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Questions, demo requests, or partnership inquiries — here&apos;s how to reach the Leinaflow team.
          </p>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            <Card variant="elevated" padding="lg">
              <div className="w-10 h-10 rounded-xl bg-violet-600/15 flex items-center justify-center">
                <Mail size={20} className="text-violet-400" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-text-primary">General Inquiries</h2>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                Questions about the platform, your account, or anything else.
              </p>
              <a
                href="mailto:hello@leinaflow.com"
                className="mt-4 inline-block text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
              >
                hello@leinaflow.com
              </a>
            </Card>

            <Card variant="elevated" padding="lg" className="lg:col-span-2">
              <div className="w-10 h-10 rounded-xl bg-violet-600/15 flex items-center justify-center">
                <Calendar size={20} className="text-violet-400" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-text-primary">Request a Demo</h2>
              <p className="mt-2 text-sm text-text-muted leading-relaxed mb-6">
                Tell us a bit about your team and we&apos;ll walk you through Leinaflow.
              </p>
              <DemoRequestForm />
            </Card>

            <Card variant="elevated" padding="lg" className="lg:col-span-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="w-10 h-10 rounded-xl bg-violet-600/15 flex items-center justify-center shrink-0">
                  <Briefcase size={20} className="text-violet-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-text-primary">Business & Partnership Inquiries</h2>
                  <p className="mt-1 text-sm text-text-muted leading-relaxed">
                    Partnerships, integrations, and enterprise conversations.
                  </p>
                </div>
                <a
                  href="mailto:partnerships@leinaflow.com"
                  className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors shrink-0"
                >
                  partnerships@leinaflow.com
                </a>
              </div>
            </Card>
          </div>
        </Container>
      </section>
    </>
  );
}
