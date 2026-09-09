'use client';

import {
  SCOREBOARD_PERIODS,
  SCOREBOARD_PERIOD_LABELS,
  type ScoreboardPeriod,
} from '@/lib/scoreboardTypes';

export default function ScoreboardPeriodPills({
  period,
  onChange,
  className = 'mb-4 grid grid-cols-3 gap-2',
}: {
  period: ScoreboardPeriod;
  onChange: (period: ScoreboardPeriod) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      {SCOREBOARD_PERIODS.map((option) => {
        const selected = option === period;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`min-h-12 rounded-2xl border text-base font-semibold ${
              selected
                ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]'
                : 'border-white/10 bg-black/25 text-[#f6f1e3]/75'
            }`}
          >
            {SCOREBOARD_PERIOD_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
