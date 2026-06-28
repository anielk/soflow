interface SkeletonProps {
  width?:    string | number;
  height?:   string | number;
  rounded?:  'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const roundedClasses = {
  sm:   'rounded-sm',
  md:   'rounded-md',
  lg:   'rounded-lg',
  full: 'rounded-full',
} as const;

export function Skeleton({ width, height, rounded = 'md', className = '' }: SkeletonProps) {
  return (
    <div
      className={[
        'bg-bg-subtle animate-skeleton',
        roundedClasses[rounded],
        className,
      ].join(' ')}
      style={{ width, height }}
    />
  );
}

// ---------------------------------------------------------------------------
// Text block skeleton — renders N lines of decreasing width
// ---------------------------------------------------------------------------
interface TextSkeletonProps {
  lines?:    number;
  className?: string;
}

export function TextSkeleton({ lines = 3, className = '' }: TextSkeletonProps) {
  const widths = ['100%', '85%', '70%', '90%', '60%'];
  return (
    <div className={['flex flex-col gap-2', className].join(' ')}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          width={widths[i % widths.length]}
          rounded="sm"
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card skeleton
// ---------------------------------------------------------------------------
export function StatCardSkeleton() {
  return (
    <div className="bg-bg-surface border border-bg-border rounded-md p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton width={80} height={12} rounded="sm" />
        <Skeleton width={24} height={24} rounded="md" />
      </div>
      <Skeleton width={120} height={32} rounded="sm" />
      <Skeleton width={64} height={12} rounded="sm" />
    </div>
  );
}
