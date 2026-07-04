import { Check } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { ButtonLink } from './ButtonLink';
import type { PricingTier } from './data';

export function PricingCard({ name, tagline, features, highlighted, cta, ctaHref }: PricingTier) {
  return (
    <Card
      variant={highlighted ? 'gradient' : 'elevated'}
      padding="lg"
      className={highlighted ? 'relative' : 'relative flex flex-col'}
    >
      {highlighted && (
        <Badge variant="default" size="sm" className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-violet-700">
          Most Popular
        </Badge>
      )}

      <h3 className={['text-lg font-semibold', highlighted ? 'text-white' : 'text-text-primary'].join(' ')}>
        {name}
      </h3>
      <p className={['mt-1.5 text-sm', highlighted ? 'text-white/80' : 'text-text-muted'].join(' ')}>{tagline}</p>

      <div className="mt-5">
        <span className={['text-3xl font-bold', highlighted ? 'text-white' : 'text-text-primary'].join(' ')}>
          Custom
        </span>
        <span className={['ml-2 text-sm', highlighted ? 'text-white/70' : 'text-text-muted'].join(' ')}>pricing</span>
      </div>

      <ul className="mt-6 flex flex-col gap-3 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <Check size={16} className={['shrink-0 mt-0.5', highlighted ? 'text-white' : 'text-violet-400'].join(' ')} />
            <span className={highlighted ? 'text-white/90' : 'text-text-secondary'}>{feature}</span>
          </li>
        ))}
      </ul>

      <ButtonLink href={ctaHref} variant={highlighted ? 'white' : 'primary'} size="lg" className="w-full mt-7">
        {cta}
      </ButtonLink>
    </Card>
  );
}
