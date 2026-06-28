'use client';

import type { Period } from '@/types/dashboard';

interface PeriodSelectorProps {
  value:    Period;
  onChange: (p: Period) => void;
}

const OPTIONS: { value: Period; label: string }[] = [
  { value: 'yesterday',  label: 'Yesterday'  },
  { value: 'today',      label: 'Today'      },
  { value: 'this_week',  label: 'This week'  },
  { value: 'this_month', label: 'This month' },
];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Time period"
      className="inline-flex items-center gap-0.5 p-0.5 bg-bg-subtle rounded-lg border border-bg-border"
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={[
              'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 select-none',
              active
                ? 'bg-violet-600 text-white shadow-card'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-overlay',
            ].join(' ')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
