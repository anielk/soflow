import { Card, Badge } from '@/components/ui';
import { ROADMAP_STATUS_LABEL, type RoadmapItem, type RoadmapStatus } from './data';

const STATUS_BADGE_VARIANT: Record<RoadmapStatus, 'success' | 'violet' | 'default' | 'warning'> = {
  released: 'success',
  'in-progress': 'violet',
  planned: 'default',
  future: 'warning',
};

export function RoadmapCard({ status, title, description }: RoadmapItem) {
  return (
    <Card variant="default" padding="md">
      <Badge variant={STATUS_BADGE_VARIANT[status]} size="sm">
        {ROADMAP_STATUS_LABEL[status]}
      </Badge>
      <h3 className="mt-3 text-sm font-semibold text-text-primary">{title}</h3>
      <p className="mt-1.5 text-sm text-text-muted leading-relaxed">{description}</p>
    </Card>
  );
}
