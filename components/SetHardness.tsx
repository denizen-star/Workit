'use client';

import { useState } from 'react';
import { HARDNESS_LABELS, HARDNESS_SCORES, type HardnessScore } from '@/lib/hardness';

export default function SetHardness({
  value,
  busy,
  highlight,
  forceEditable,
  onPick,
}: {
  value: HardnessScore | null;
  busy?: boolean;
  /** Gold outline for the first time this prompt appears, as a "vote here next" cue. */
  highlight?: boolean;
  /** Reopen an already-rated vote for changing — the explicit "Editing" flow on a completed set. */
  forceEditable?: boolean;
  onPick: (score: HardnessScore) => void;
}) {
  // Optimistic drag position before the pick round-trips and (outside of forceEditable) locks in.
  const [pending, setPending] = useState<HardnessScore | null>(null);
  const locked = value != null && !forceEditable;
  const disabled = locked || busy;
  // `shown` is null until the athlete actually picks something — the track starts at
  // 0 (no dots filled), not pre-filled to Fair. Skipping it still silently scores as
  // Fair (3) wherever hardness is read (averageHardness, hardnessEffortFactor, etc.);
  // this is purely about not showing a rating that was never actually made.
  const shown = pending ?? value;
  const sliderValue = shown ?? 1;

  return (
    <div className={`mt-3 flex items-center gap-2 ${highlight ? 'rounded-lg border border-[#e8c547]/50 p-1.5' : ''}`}>
      <div className="relative flex h-6 flex-1 items-center">
        <input
          type="range"
          aria-label="How hard was this set"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={sliderValue}
          aria-valuetext={shown != null ? `${shown} ${HARDNESS_LABELS[shown]}` : 'Not rated'}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          min={1}
          max={5}
          step={1}
          value={sliderValue}
          onChange={(event) => {
            if (disabled) return;
            const score = Number(event.target.value) as HardnessScore;
            setPending(score);
            // A phone drag often updates the thumb without ever firing click, so the
            // label moved and Complete Set still saw no vote. Commit the value here.
            onPick(score);
          }}
          onPointerUp={(event) => {
            // A tap on the thumb's current spot never fires onChange. pointerup still
            // does, and it is a real press — a delayed ghost click is not.
            if (disabled) return;
            onPick(Number(event.currentTarget.value) as HardnessScore);
          }}
          onKeyUp={(event) => {
            // Keyboard (arrow keys, Home/End) never fires click at all.
            if (disabled) return;
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
            onPick(Number(event.currentTarget.value) as HardnessScore);
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
              className={`h-1.5 w-1.5 rounded-full ${shown != null && score <= shown ? 'bg-[#e8c547]' : 'bg-white/20'}`}
            />
          ))}
        </div>
      </div>
      <span className="w-14 shrink-0 text-right text-[10px] font-black text-[#e8c547]">
        {shown != null ? HARDNESS_LABELS[shown] : ''}
      </span>
    </div>
  );
}
