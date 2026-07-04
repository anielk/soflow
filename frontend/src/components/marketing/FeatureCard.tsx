import { Card } from '@/components/ui';
import type { Feature } from './data';

export function FeatureCard({ icon: Icon, title, description }: Feature) {
  return (
    <Card variant="elevated" padding="lg" className="transition-transform duration-200 hover:-translate-y-1">
      <div className="w-10 h-10 rounded-xl bg-violet-600/15 flex items-center justify-center">
        <Icon size={20} className="text-violet-400" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-text-primary">{title}</h3>
      <p className="mt-1.5 text-sm text-text-muted leading-relaxed">{description}</p>
    </Card>
  );
}
