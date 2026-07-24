import { Info } from 'lucide-react';
import { Badge } from '@/components/ui';

interface CloudivoPlannedNoticeProps {
  feature: string;
  /** One sentence on what this will eventually do — kept factual, never a promise of a date. */
  description?: string;
}

/**
 * Shown at the top of every admin page for a module that belongs to
 * Cloudivo's shared platform administration, not to Leinaflow itself
 * (Billing, Subscriptions, AI, Connectors, Customers, Feature Flags,
 * Infrastructure/Monitoring — see docs/deployment/Architecture.md's
 * multi-product notes). These pages intentionally stay as UI shells: no
 * fabricated numbers, no working buttons, no fake save confirmations —
 * only this notice plus an honest empty state.
 */
export function CloudivoPlannedNotice({ feature, description }: CloudivoPlannedNoticeProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-bg-border bg-bg-subtle p-4">
      <Info size={18} className="text-text-muted mt-0.5 shrink-0" />
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-text-primary">{feature} is not part of Leinaflow</p>
          <Badge variant="violet" size="sm">Planned &middot; Cloudivo</Badge>
        </div>
        <p className="text-sm text-text-muted">
          {description ??
            `${feature} is shared platform functionality that will live in Cloudivo, not in this product. Nothing on this page is tracked, saved, or connected yet.`}
        </p>
      </div>
    </div>
  );
}
