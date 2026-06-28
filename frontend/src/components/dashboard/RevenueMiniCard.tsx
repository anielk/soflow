import { formatCurrency } from '@/lib/format';

interface RevenueMiniCardProps {
  label:  string;
  amount: number;
  total:  number;
  color:  string; // hex color for the category dot
}

export function RevenueMiniCard({ label, amount, total, color }: RevenueMiniCardProps) {
  const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : '0.0';

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-bg-subtle hover:bg-bg-overlay transition-colors duration-150 group">
      <div className="flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span className="text-xs text-text-muted font-medium truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-text-primary tabular-nums">
          {formatCurrency(amount)}
        </span>
        <span className="text-2xs text-text-disabled tabular-nums">{pct}%</span>
      </div>
    </div>
  );
}
