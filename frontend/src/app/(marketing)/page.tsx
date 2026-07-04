import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BarChart3,
  Calendar,
  Clock,
  HelpCircle,
  KeyRound,
  Layers,
  Lock,
  MessageSquare,
  ShieldCheck,
  Smile,
  Table2,
  Users,
  Users2,
  Workflow,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Logo } from '@/components/brand/Logo';
import { Container } from '@/components/marketing/Container';
import { ButtonLink } from '@/components/marketing/ButtonLink';
import { FeatureCard } from '@/components/marketing/FeatureCard';
import { DashboardMockup } from '@/components/marketing/DashboardMockup';
import { FaqAccordion } from '@/components/marketing/FaqAccordion';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';
import { FEATURES } from '@/components/marketing/data';

export const metadata: Metadata = {
  title: { absolute: 'Leinaflow — Run your agency without the chaos' },
  description:
    'Leinaflow replaces the spreadsheets, shared drives, and status-check messages agencies run on with one workspace for every creator, file, and teammate.',
  openGraph: {
    title: 'Leinaflow — Run your agency without the chaos',
    description: 'One workspace for every creator, file, and teammate — instead of five disconnected tools.',
    type: 'website',
    siteName: 'Leinaflow',
  },
};

// The "before" — specific, relatable friction, not abstract feature gaps.
const PAIN_POINTS = [
  { icon: Table2, text: 'A spreadsheet three people are editing at the same time.' },
  { icon: MessageSquare, text: 'Status updates scattered across Slack, WhatsApp, and someone’s memory.' },
  { icon: Lock, text: 'Five different logins just to check on one creator.' },
  { icon: HelpCircle, text: 'No idea who’s actually behind — until it’s already a problem.' },
];

// The "after" — outcomes, not capabilities. What changes, not what it's called.
const OUTCOMES = [
  {
    icon: Clock,
    title: 'Save hours every week',
    description: 'Automate status updates, reporting, and repetitive admin work.',
  },
  {
    icon: Users,
    title: 'Everyone stays aligned',
    description: 'Clear roles, real-time updates, and no more "who\'s doing what?"',
  },
  {
    icon: BarChart3,
    title: 'See what\'s working',
    description: 'One dashboard for content, revenue, and creator performance.',
  },
  {
    icon: Smile,
    title: 'Creators love the experience',
    description: 'Faster approvals, better feedback, stronger relationships.',
  },
];

const SECURITY_POINTS = [
  { icon: KeyRound, title: 'Role-Based Access', description: 'Fine-grained roles control exactly what each team member can see and do.' },
  { icon: Lock, title: 'Workspace Isolation', description: 'Every workspace is isolated by design — not bolted on as an afterthought.' },
  { icon: ShieldCheck, title: 'Encrypted Secrets', description: 'API keys and credentials are encrypted at rest, never exposed in the client.' },
];

const AI_POINTS = [
  { icon: Layers, title: 'Multi-Provider', description: 'Bring the AI providers your team already uses — nothing locked to a single vendor.' },
  { icon: Workflow, title: 'Quiet Automation', description: 'AI handles repetitive work in the background so your team can focus on creators.' },
  { icon: Users2, title: 'Team-Wide', description: 'Available across the whole workspace, not held back for a single seat.' },
];

const FAQ_ITEMS = [
  {
    question: 'What actually happens on the demo?',
    answer:
      'We look at your current workflow, show you how it maps onto Leinaflow, and you leave knowing whether it’s a fit — not sitting through a generic slide deck.',
  },
  {
    question: 'Do I need to migrate everything on day one?',
    answer: 'No. Most agencies start with one team or their next batch of creators, then expand once it proves out.',
  },
  {
    question: 'Is my data isolated from other workspaces?',
    answer: 'Yes. Every workspace is a separate tenant boundary — teams and data are never shared across workspaces.',
  },
  {
    question: 'Can I bring my own AI provider?',
    answer: 'Yes — bring the AI providers your team already uses. Nothing is locked to a single vendor.',
  },
  {
    question: "What if it's not the right fit?",
    answer: 'Then you’ll know quickly — the call is built to surface that honestly, not talk you into anything.',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero — outcome first, not category-explaining. A very soft ambient
          glow sits behind the whole hero (reusing the existing brand
          gradient, just blurred and dim) instead of a flat background. */}
      <section className="relative pt-20 pb-16 sm:pt-28 sm:pb-16 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center"
        >
          <div className="w-[640px] h-[420px] bg-gradient-primary opacity-[0.18] blur-3xl rounded-full" />
        </div>

        <Container className="text-center animate-fade-in">
          <p className="text-sm font-semibold uppercase tracking-wider text-violet-400">
            For creator agencies who&apos;ve outgrown spreadsheets
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-[1.1]">
            Your agency doesn&apos;t need more tools.
            <br />
            It needs <span className="text-gradient-primary">one that works</span>.
          </h1>

          <div className="relative flex justify-center mt-8">
            {/* Very subtle glow behind the mark — present, not glowing "at" the visitor. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10"
            >
              <div className="w-40 h-40 bg-violet-600 opacity-[0.18] blur-3xl rounded-full" />
            </div>
            <Logo iconSize={72} textClassName="text-6xl sm:text-7xl font-bold tracking-tight text-text-primary" />
          </div>

          <p className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Leinaflow replaces the spreadsheets, shared drives, and &ldquo;let me check and get back to you&rdquo;
            messages with a single workspace for every creator, file, and teammate.
          </p>
          <div className="mt-9 flex flex-col items-center gap-4">
            <ButtonLink href="/contact" size="lg" icon={Calendar}>
              Request a Demo
            </ButtonLink>
            <p className="text-sm">
              <span className="text-text-muted">Prefer to explore on your own? </span>
              <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                Start a free trial →
              </Link>
            </p>
          </div>
          <p className="mt-6 text-xs text-text-disabled">20 minutes. Your real workflow. No generic pitch.</p>
        </Container>
      </section>

      {/* Visual proof, right up front — this is the product, not an
          illustration of a claim. Wider than the rest of the page on
          purpose, and allowed to bleed slightly into the section below. */}
      <section className="relative pb-6 sm:pb-8">
        <Container size="wide">
          <ScrollReveal>
            <DashboardMockup />
          </ScrollReveal>
        </Container>
      </section>

      {/* Curiosity / problem — named before anything is explained. Pulled up
          slightly under the dashboard's glow instead of a hard divider line,
          so the transition feels continuous rather than a new "section". */}
      <section className="relative -mt-2 pt-16 pb-24 sm:pt-20 sm:pb-28">
        <Container>
          <ScrollReveal>
            <h2 className="text-3xl font-bold tracking-tight text-text-primary text-center">Sound familiar?</h2>
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PAIN_POINTS.map(({ icon: Icon, text }) => (
                <Card
                  key={text}
                  variant="default"
                  padding="lg"
                  className="transition-all duration-200 hover:-translate-y-1 hover:shadow-soft"
                >
                  <div className="w-9 h-9 rounded-lg bg-violet-600/15 flex items-center justify-center">
                    <Icon size={18} className="text-violet-400" />
                  </div>
                  <p className="mt-3 text-sm text-text-secondary leading-relaxed">{text}</p>
                </Card>
              ))}
            </div>
            <p className="mt-10 text-center text-lg text-text-primary font-medium">
              Leinaflow was built to make this the last time you deal with it.
            </p>
          </ScrollReveal>
        </Container>
      </section>

      {/* Trust — honest, not fabricated. No invented customers or quotes:
          just what's actually true about how this was built. */}
      <section className="py-20 sm:py-24 border-t border-bg-border">
        <Container className="max-w-2xl text-center">
          <ScrollReveal>
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-400">How it came together</p>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Built together with early design partners
            </h2>
            <p className="mt-4 text-text-muted leading-relaxed">
              Every workflow in Leinaflow — from creator profiles to team roles — was shaped by direct feedback from
              creator agencies managing multiple teams and talent, not designed in a vacuum.
            </p>
          </ScrollReveal>
        </Container>
      </section>

      {/* The after-state — outcomes, still no feature list */}
      <section className="py-20 sm:py-24 border-t border-bg-border">
        <Container>
          <ScrollReveal>
            <h2 className="text-3xl font-bold tracking-tight text-text-primary text-center mb-12">
              What changes from day one
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {OUTCOMES.map(({ icon: Icon, title, description }) => (
                <Card
                  key={title}
                  variant="default"
                  padding="lg"
                  className="transition-all duration-200 hover:-translate-y-1 hover:shadow-soft"
                >
                  <Icon size={20} className="text-violet-400" />
                  <h3 className="mt-3 text-base font-semibold text-text-primary">{title}</h3>
                  <p className="mt-2 text-sm text-text-muted leading-relaxed">{description}</p>
                </Card>
              ))}
            </div>
          </ScrollReveal>
        </Container>
      </section>

      {/* Functionality — only now, as support for the promise already made */}
      <section className="py-20 sm:py-24 border-t border-bg-border">
        <Container>
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-text-primary">What&apos;s inside</h2>
              <p className="mt-3 text-text-muted">The parts that make the outcome above actually happen.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.slice(0, 6).map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <ButtonLink href="/features" variant="ghost">
                See everything that&apos;s included →
              </ButtonLink>
            </div>
          </ScrollReveal>
        </Container>
      </section>

      {/* Security — trust reinforcement, framed as risk reduction */}
      <section className="py-20 sm:py-24 border-t border-bg-border">
        <Container>
          <ScrollReveal>
            <div className="grid lg:grid-cols-[minmax(0,1fr)_2fr] gap-10 items-start">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-text-primary">Built to be trusted with your business</h2>
                <p className="mt-3 text-text-muted leading-relaxed">
                  Every workspace is isolated and access is controlled by design — not bolted on later.
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-5">
                {SECURITY_POINTS.map(({ icon: Icon, title, description }) => (
                  <div key={title}>
                    <div className="w-9 h-9 rounded-lg bg-violet-600/15 flex items-center justify-center">
                      <Icon size={18} className="text-violet-400" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-text-primary">{title}</h3>
                    <p className="mt-1.5 text-sm text-text-muted leading-relaxed">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </section>

      {/* AI — practical framing, not hype */}
      <section className="py-20 sm:py-24 border-t border-bg-border">
        <Container>
          <ScrollReveal>
            <div className="grid lg:grid-cols-[minmax(0,1fr)_2fr] gap-10 items-start">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-text-primary">AI that stays out of your way</h2>
                <p className="mt-3 text-text-muted leading-relaxed">
                  Connects to the AI providers you already use, and works quietly in the background.
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-5">
                {AI_POINTS.map(({ icon: Icon, title, description }) => (
                  <div key={title}>
                    <div className="w-9 h-9 rounded-lg bg-violet-600/15 flex items-center justify-center">
                      <Icon size={18} className="text-violet-400" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-text-primary">{title}</h3>
                    <p className="mt-1.5 text-sm text-text-muted leading-relaxed">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </section>

      {/* FAQ — objection-handling aimed at the demo decision specifically */}
      <section className="py-20 sm:py-24 border-t border-bg-border">
        <Container className="max-w-3xl">
          <ScrollReveal>
            <h2 className="text-3xl font-bold tracking-tight text-text-primary text-center mb-12">
              Before you request a demo
            </h2>
            <FaqAccordion items={FAQ_ITEMS} />
          </ScrollReveal>
        </Container>
      </section>

      {/* Closing CTA — one objective, stated once, clearly */}
      <section className="py-20 sm:py-24 border-t border-bg-border">
        <Container>
          <ScrollReveal>
            <Card variant="gradient" padding="lg" className="text-center py-14">
              <h2 className="text-3xl font-bold tracking-tight text-white">Ready to run your agency on Leinaflow?</h2>
              <p className="mt-3 text-white/80 max-w-xl mx-auto">See the platform in action with your real workflow.</p>
              <div className="mt-8 flex flex-col items-center gap-3">
                <ButtonLink href="/contact" variant="white" size="lg" icon={Calendar}>
                  Request a Demo
                </ButtonLink>
                <p className="text-sm text-white/70">
                  Prefer to explore on your own?{' '}
                  <Link href="/register" className="text-white font-medium hover:underline">
                    Start a free trial →
                  </Link>
                </p>
              </div>
            </Card>
          </ScrollReveal>
        </Container>
      </section>
    </>
  );
}
