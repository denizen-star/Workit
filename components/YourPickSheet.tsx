'use client';

import { useState } from 'react';
import YourPickIcon from '@/components/YourPickIcon';
import type { WorkoutDay } from '@/lib/workoutData';
import {
  isTimedPickType,
  pickModesFor,
  yourPickLabel,
  YOUR_PICK_TYPES,
  type YourPickMode,
  type YourPickType,
} from '@/lib/yourPick';

export type YourPickChoice = {
  pickType: YourPickType;
  pickMode: YourPickMode;
  /** Program day this pick stands in for, or null for an add. */
  swapForDay: number | null;
};

const MODE_COPY: Record<YourPickMode, { label: string; hint: string }> = {
  sets: { label: 'Sets', hint: '' },
  timed: { label: 'Timed', hint: 'Each hold moves on with the clock, or when you tap it done.' },
  done: { label: 'Mark done', hint: 'Do it your way. Done unlocks at 30 minutes. Once a day.' },
};

function shortName(name: string) {
  return name.replace(' Body ', ' ');
}

/**
 * Your pick picker (docs/plans/PLAN_YOUR_PICK.md): type → (Yoga/Core) Timed or Mark
 * done → Add to the week, or Swap for an unstarted program day. Holds no network
 * calls — the caller starts the session, same pattern as AltExerciseTakeover. The
 * caller mounts it only while open, so every open starts from a fresh choice.
 */
export default function YourPickSheet({
  open,
  weekNumber,
  swapTargets,
  initialSwapForDay = null,
  onStart,
  onClose,
}: {
  open: boolean;
  weekNumber: number;
  /** Pre-select "Swap for <day>" (a day card's Swap button). */
  initialSwapForDay?: number | null;
  /** Unstarted program days a pick can replace (`yourPickSwapTargets`). */
  swapTargets: WorkoutDay[];
  onStart: (choice: YourPickChoice) => void;
  onClose: () => void;
}) {
  const [pickType, setPickType] = useState<YourPickType>('upper');
  const [pickMode, setPickMode] = useState<YourPickMode>('sets');
  const [swapForDay, setSwapForDay] = useState<number | null>(initialSwapForDay);

  if (!open) return null;

  const chooseType = (type: YourPickType) => {
    setPickType(type);
    setPickMode(pickModesFor(type)[0]);
  };
  const pill = (active: boolean) =>
    `min-h-11 rounded-2xl border px-3 text-sm font-black ${
      active ? 'border-[#e8c547] bg-[#e8c547] text-[#1a1404]' : 'border-white/15 text-[#f6f1e3]'
    }`;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="glass-card max-h-[90vh] w-full max-w-md overflow-y-auto p-5">
        <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#f6f1e3]/55">
          <YourPickIcon /> Week {weekNumber}
        </p>
        <h2 className="mt-1 text-2xl font-black text-white">Your pick</h2>
        <p className="mt-2 text-sm text-[#f6f1e3]/70">
          Any body part, any day. It counts toward the week, belts and medals.
        </p>

        <p className="mt-5 text-[11px] font-black uppercase tracking-[0.16em] text-[#f6f1e3]/50">Workout</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {YOUR_PICK_TYPES.map((type) => (
            <button key={type} type="button" onClick={() => chooseType(type)} className={pill(pickType === type)}>
              {yourPickLabel(type)}
            </button>
          ))}
        </div>

        {isTimedPickType(pickType) ? (
          <>
            <p className="mt-5 text-[11px] font-black uppercase tracking-[0.16em] text-[#f6f1e3]/50">How</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {pickModesFor(pickType).map((mode) => (
                <button key={mode} type="button" onClick={() => setPickMode(mode)} className={pill(pickMode === mode)}>
                  {MODE_COPY[mode].label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#f6f1e3]/55">{MODE_COPY[pickMode].hint}</p>
          </>
        ) : null}

        <p className="mt-5 text-[11px] font-black uppercase tracking-[0.16em] text-[#f6f1e3]/50">This week</p>
        <div className="mt-2 flex flex-col gap-2">
          <button type="button" onClick={() => setSwapForDay(null)} className={pill(swapForDay == null)}>
            Add to the week
          </button>
          {swapTargets.map((day) => (
            <button
              key={day.dayNumber}
              type="button"
              onClick={() => setSwapForDay(day.dayNumber)}
              className={pill(swapForDay === day.dayNumber)}
            >
              Swap for {shortName(day.name)}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onStart({ pickType, pickMode, swapForDay })}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#e8c547] text-sm font-black text-[#1a1404]"
        >
          <YourPickIcon className="h-4 w-4 text-[#1a1404]" />
          Start {yourPickLabel(pickType)}
        </button>
        <button type="button" onClick={onClose} className="mt-3 w-full py-2 text-sm font-semibold text-[#f6f1e3]/55">
          Not now
        </button>
      </div>
    </div>
  );
}
