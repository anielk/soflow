import type { Metadata } from 'next';
import { Container } from '@/components/marketing/Container';
import { RoadmapCard } from '@/components/marketing/RoadmapCard';
import { ROADMAP_ITEMS, ROADMAP_STATUS_LABEL, type RoadmapStatus } from '@/components/marketing/data';

export const metadata: Metadata = {
  title: 'Roadmap',
  description: 'What Leinaflow has shipped, what is in progress, and what is planned next.',
  openGraph: {
    title: 'Roadmap · Leinaflow',
    description: 'What Leinaflow has shipped, what is in progress, and what is planned next.',
    type: 'website',
    siteName: 'Leinaflow',
  },
};

const STATUS_ORDER: RoadmapStatus[] = ['released', 'in-progress', 'planned', 'future'];

export default function RoadmapPage() {
  return (
    <>
      <section className="pt-16 pb-10 sm:pt-24 sm:pb-14">
        <Container className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-text-primary">
            Product <span className="text-gradient-primary">Roadmap</span>
          </h1>
          <p className="mt-5 text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            A public look at what we&apos;ve shipped and what&apos;s coming next. This roadmap is illustrative
            and subject to change as priorities evolve.
          </p>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STATUS_ORDER.map((status) => {
              const items = ROADMAP_ITEMS.filter((item) => item.status === status);
              return (
                <div key={status}>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-text-disabled mb-4">
                    {ROADMAP_STATUS_LABEL[status]}
                  </h2>
                  <div className="flex flex-col gap-4">
                    {items.map((item) => (
                      <RoadmapCard key={item.title} {...item} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>
    </>
  );
}
