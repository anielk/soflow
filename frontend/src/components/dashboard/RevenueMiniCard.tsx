import { formatCurrency } from '@/lib/format';

interface RevenueMiniCardProps {
  label:  string;
  amount: number;
  total:  number;
  color:  string; // hex color for the category
}

export function RevenueMiniCard({ label, amount, total, color }: RevenueMiniCardProps) {
  const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : '0.0';

  return (
    <div
      className="flex flex-col gap-2 p-3 rounded-lg bg-bg-subtle hover:bg-bg-overlay transition-colors duration-150 border-l-[2px]"
      style={{ borderLeftColor: color }}
    >
      <span className="text-[11px] font-medium text-text-muted truncate leading-none">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-text-primary tabular-nums leading-none">
          {formatCurrency(amount)}
        </span>
        <span className="text-[10px] text-text-disabled tabular-nums">{pct}%</span>
      </div>
    </div>
  );
}
