'use client';

import { useState } from 'react';
import { HARDNESS_LABELS, HARDNESS_SCORES, type HardnessScore } from '@/lib/hardness';

export default function SetHardness({
  value,
  busy,
  highlight,
  onPick,
}: {
  value: HardnessScore | null;
  busy?: boolean;
  /** Gold outline for the first time this prompt appears, as a "vote here next" cue. */
  highlight?: boolean;
  onPick: (score: HardnessScore) => void;
}) {
  // Optimistic drag position before the pick round-trips and locks `value` in.
  const [pending, setPending] = useState<HardnessScore | null>(null);
  const locked = value != null;
  const disabled = locked || busy;
  const shown = locked ? value : (pending ?? 3);

  return (
    <div className={`mt-3 flex items-center gap-2 ${highlight ? 'rounded-lg border border-[#e8c547]/50 p-1.5' : ''}`}>
      <div className="relative flex h-6 flex-1 items-center">
        <input
          type="range"
          aria-label="How hard was this set"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={shown}
          aria-valuetext={`${shown} ${HARDNESS_LABELS[shown]}`}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          min={1}
          max={5}
          step={1}
          value={shown}
          onChange={(event) => {
            if (disabled) return;
            setPending(Number(event.target.value) as HardnessScore);
          }}
          onPointerUp={() => {
            if (disabled || pending == null) return;
            onPick(pending);
          }}
          // Locked/busy skips the native `disabled` attribute on purpose — most browsers gray
          // out a disabled range's accent color, which reads as "broken" once it's rated gold.
          // `pointer-events-none` blocks further input while keeping the gold track/thumb.
          className={`absolute inset-x-0 h-6 w-full accent-[#e8c547] ${disabled ? 'pointer-events-none' : ''}`}
        />
        <div className="pointer-events-none absolute inset-x-1 flex justify-between">
          {HARDNESS_SCORES.map((score) => (
            <span
              key={score}
              className={`h-1.5 w-1.5 rounded-full ${score <= shown ? 'bg-[#e8c547]' : 'bg-white/20'}`}
            />
          ))}
        </div>
      </div>
      <span className="w-14 shrink-0 text-right text-[10px] font-black text-[#e8c547]">
        {HARDNESS_LABELS[shown]}
      </span>
    </div>
  );
}
