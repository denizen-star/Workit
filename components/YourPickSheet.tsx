'use client';

import { useMemo, useState } from 'react';
import YourPickIcon from '@/components/YourPickIcon';
import type { WorkoutDay } from '@/lib/workoutData';
import {
  defaultYourPickVariant,
  isTimedPickType,
  pickModesFor,
  resolveYourPickDay,
  yourPickVariantGroups,
  type YourPickMode,
  type YourPickType,
} from '@/lib/yourPick';

export type YourPickChoice = {
  pickType: YourPickType;
  pickMode: YourPickMode;
  /** The specific workout picked (its Your pick day number, lib/yourPick.ts). */
  pickDay: number;
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
 * Your pick picker (docs/plans/PLAN_YOUR_PICK.md): a grouped dropdown of specific
 * workouts (Upper / Lower / Full body / Core & other) → (Yoga/Core) Timed or Mark
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
  const groups = useMemo(() => yourPickVariantGroups(), []);
  const [pickDay, setPickDay] = useState<number>(() => defaultYourPickVariant(weekNumber).dayNumber);
  const [pickMode, setPickMode] = useState<YourPickMode>('sets');
  const [swapForDay, setSwapForDay] = useState<number | null>(initialSwapForDay);

  const variant = groups.flatMap((group) => group.variants).find((item) => item.dayNumber === pickDay);
  const pickType: YourPickType = variant?.type ?? 'upper';
  const preview = useMemo(() => resolveYourPickDay(weekNumber, pickDay), [weekNumber, pickDay]);

  if (!open) return null;

  const chooseWorkout = (dayNumber: number) => {
    const next = groups.flatMap((group) => group.variants).find((item) => item.dayNumber === dayNumber);
    if (!next) return;
    setPickDay(dayNumber);
    setPickMode(pickModesFor(next.type)[0]);
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
        <select
          value={pickDay}
          onChange={(event) => chooseWorkout(Number(event.target.value))}
          aria-label="Workout"
          className="mt-2 min-h-12 w-full rounded-2xl border border-[#e8c547] bg-[#1a1404] px-3 text-base font-black text-[#f6f1e3]"
        >
          {groups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.variants.map((item) => (
                <option key={item.dayNumber} value={item.dayNumber}>
                  {item.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {variant ? (
          <div className="mt-3 rounded-2xl border border-[#e8c547] bg-black p-4">
            <p className="text-sm font-black text-white">{variant.description}</p>
            {preview && !isTimedPickType(pickType) ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#f6f1e3] marker:text-[#e8c547]">
                {preview.exercises.map((exercise) => (
                  <li key={exercise.name}>
                    {exercise.name} · {exercise.sets} × {exercise.reps}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

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
          onClick={() => onStart({ pickType, pickMode, pickDay, swapForDay })}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#e8c547] text-sm font-black text-[#1a1404]"
        >
          <YourPickIcon className="h-4 w-4 text-[#1a1404]" />
          Start {variant?.label ?? 'Your pick'}
        </button>
        <button type="button" onClick={onClose} className="mt-3 w-full py-2 text-sm font-semibold text-[#f6f1e3]/55">
          Not now
        </button>
      </div>
    </div>
  );
}
