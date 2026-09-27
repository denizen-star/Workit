'use client';

import { useEffect, useRef, useState } from 'react';
import { HARDNESS_LABELS, HARDNESS_SCORES, type HardnessScore } from '@/lib/hardness';

// Fallback commit for a deferred slider moved without a pointer gesture (keyboard,
// assistive tech) — a real drag commits on release instead.
const IDLE_COMMIT_MS = 600;

export default function SetHardness({
  value,
  busy,
  highlight,
  forceEditable,
  deferCommit,
  onPick,
}: {
  value: HardnessScore | null;
  busy?: boolean;
  /** Gold outline for the first time this prompt appears, as a "vote here next" cue. */
  highlight?: boolean;
  /** Reopen an already-rated vote for changing — the explicit "Editing" flow on a completed set. */
  forceEditable?: boolean;
  /**
   * Commit once, when the drag is released, instead of on every step the thumb passes.
   * Use wherever a pick is saved or acted on (network save, folding the row, moving to the
   * next hold) — committing mid-drag there locked in the first step (dragging to Hard saved
   * Light) or fired one save per step. Leave off for in-memory picks, where every step is free.
   */
  deferCommit?: boolean;
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

  // Deferred-commit bookkeeping. Refs, not state: pointer events land between renders.
  const pendingRef = useRef<HardnessScore | null>(null);
  const dirtyRef = useRef(false);
  const gestureRef = useRef(false);
  const changedInGestureRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPickRef = useRef(onPick);
  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const flush = () => {
    clearTimer();
    if (!dirtyRef.current || pendingRef.current == null) return;
    dirtyRef.current = false;
    onPickRef.current(pendingRef.current);
  };

  // A drag still in flight when the row unmounts (or the page moves on) is still a vote.
  useEffect(() => () => flush(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const release = (current: HardnessScore) => {
    if (!gestureRef.current) return;
    gestureRef.current = false;
    if (dirtyRef.current) {
      flush();
    } else if (!changedInGestureRef.current) {
      // A tap on the thumb's current spot never fires onChange — it is still a pick.
      onPickRef.current(current);
    }
  };

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
          onPointerDown={() => {
            if (disabled || !deferCommit) return;
            gestureRef.current = true;
            changedInGestureRef.current = false;
          }}
          onChange={(event) => {
            if (disabled) return;
            const score = Number(event.target.value) as HardnessScore;
            setPending(score);
            if (deferCommit) {
              pendingRef.current = score;
              dirtyRef.current = true;
              changedInGestureRef.current = true;
              clearTimer();
              if (!gestureRef.current) timerRef.current = setTimeout(flush, IDLE_COMMIT_MS);
              return;
            }
            // A phone drag often updates the thumb without ever firing click, so the
            // label moved and Complete Set still saw no vote. Commit the value here.
            onPick(score);
          }}
          onPointerUp={(event) => {
            if (disabled) return;
            if (deferCommit) {
              release(Number(event.currentTarget.value) as HardnessScore);
              return;
            }
            // A tap on the thumb's current spot never fires onChange. pointerup still
            // does, and it is a real press — a delayed ghost click is not.
            onPick(Number(event.currentTarget.value) as HardnessScore);
          }}
          // Some phones end a range drag with pointercancel or only touchend.
          onPointerCancel={(event) => deferCommit && release(Number(event.currentTarget.value) as HardnessScore)}
          onTouchEnd={(event) => deferCommit && release(Number(event.currentTarget.value) as HardnessScore)}
          onBlur={() => deferCommit && flush()}
          onKeyUp={(event) => {
            // Keyboard (arrow keys, Home/End) never fires click at all.
            if (disabled) return;
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
            if (deferCommit && dirtyRef.current) {
              flush();
              return;
            }
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
