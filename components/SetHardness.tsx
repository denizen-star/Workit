'use client';

import { useState } from 'react';
import { HARDNESS_LABELS, HARDNESS_SCORES, type HardnessScore } from '@/lib/hardness';

export default function SetHardness({
  value,
  busy,
  onPick,
}: {
  value: HardnessScore | null;
  busy?: boolean;
  onPick: (score: HardnessScore) => void;
}) {
  const [pending, setPending] = useState<HardnessScore | null>(null);
  const locked = value != null;

  return (
    <div className="mt-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
        {locked ? `How hard · ${HARDNESS_LABELS[value]}` : 'How hard?'}
      </p>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="How hard was this set">
        {HARDNESS_SCORES.map((score) => {
          const selected = locked ? value === score : pending === score;
          const ends = score === 1 || score === 5;
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${score} ${HARDNESS_LABELS[score]}`}
              disabled={locked || busy}
              onClick={() => {
                if (locked || busy) return;
                setPending(score);
                onPick(score);
              }}
              className={`min-h-11 flex-1 rounded-xl border text-sm font-black ${
                selected
                  ? 'border-[#e8c547] bg-[#e8c547]/20 text-[#e8c547]'
                  : 'border-white/10 bg-black/25 text-white/45'
              } ${locked || busy ? 'cursor-default' : ''}`}
            >
              <span className="block">{score}</span>
              {ends && (
                <span className="block text-[9px] font-semibold uppercase tracking-wider">
                  {HARDNESS_LABELS[score]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
