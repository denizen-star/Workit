'use client';

import { trackAction } from '@/lib/analytics';
import { workoutModeLabel, type WorkoutMode } from '@/lib/workoutMode';

export default function ModeToggle({
  mode,
  onChange,
  locked,
  context,
}: {
  mode: WorkoutMode;
  onChange: (mode: WorkoutMode) => void;
  locked?: boolean;
  context?: string | null;
}) {
  return (
    <div
      role="group"
      aria-label={locked ? `Workout type locked to ${workoutModeLabel(mode)}` : 'Workout type'}
      className={`inline-flex shrink-0 rounded-full border border-white/15 bg-black/35 p-0.5 ${
        locked ? 'opacity-70' : ''
      }`}
    >
      {(['gym', 'travel'] as const).map((value) => (
        <button
          key={value}
          type="button"
          disabled={locked}
          onClick={() => {
            if (value !== mode) {
              trackAction('workout_mode', {
                category: 'workout',
                cta_type: value,
                article_context: context || undefined,
              });
            }
            onChange(value);
          }}
          className={`rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-wide ${
            mode === value ? 'bg-[#e8c547] text-[#1a1404]' : 'text-[#f6f1e3]/55'
          }`}
        >
          {value === 'gym' ? 'Gym' : 'Travel'}
        </button>
      ))}
    </div>
  );
}
