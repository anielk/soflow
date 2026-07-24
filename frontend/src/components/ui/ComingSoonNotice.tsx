import { Construction } from 'lucide-react';
import { Badge } from './Badge';

interface ComingSoonNoticeProps {
  feature: string;
  /** One sentence on what's missing (no backend, no data model, etc.) — factual, never a promised date. */
  description?: string;
}

/**
 * For a real Leinaflow feature that has UI but no backend yet — distinct
 * from CloudivoPlannedNotice (features/components/admin), which is for
 * functionality that belongs to a different product entirely. This one
 * says "not built yet," not "not our job."
 */
export function ComingSoonNotice({ feature, description }: ComingSoonNoticeProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-bg-border bg-bg-subtle p-4">
      <Construction size={18} className="text-text-muted mt-0.5 shrink-0" />
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-text-primary">{feature} isn&apos;t implemented yet</p>
          <Badge variant="default" size="sm">Coming soon</Badge>
        </div>
        <p className="text-sm text-text-muted">
          {description ?? 'Nothing on this page is saved, sent, or connected to a real backend yet.'}
        </p>
      </div>
    </div>
  );
}
