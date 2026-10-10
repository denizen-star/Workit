'use client';

import { useMemo, useState } from 'react';
import YourPickIcon from '@/components/YourPickIcon';
import { FOCUS_OPTIONS, type Focus, type Focuses } from '@/lib/focus';
import { focusPickGroups, pickCategoriesForFocuses, resolveFocusDay } from '@/lib/focusRotation';
import type { WorkoutDay } from '@/lib/workoutData';
import {
  defaultYourPickVariant,
  isFlowPickType,
  pickModesFor,
  resolveYourPickDay,
  yourPickVariantGroups,
  type YourPickMode,
  type YourPickType,
  type YourPickVariantGroup,
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

/** A filter chip (Focus / Category). */
const chipClass = (active: boolean) =>
  `min-h-11 rounded-full border px-4 text-sm font-black ${
    active ? 'border-[#e8c547] bg-[#e8c547] text-[#1a1404]' : 'border-white/15 text-[#f6f1e3]'
  }`;

/** One side of the Add/Swap switch. */
const segClass = (active: boolean) =>
  `min-h-10 flex-1 rounded-full px-2 text-sm font-black ${active ? 'bg-[#e8c547] text-[#1a1404]' : 'text-[#f6f1e3]'}`;

/** The categories the chosen focuses cover. */
function groupsInFocus(groups: YourPickVariantGroup[], focuses: readonly Focus[]) {
  const labels = pickCategoriesForFocuses(focuses);
  return groups.filter((group) => labels.has(group.label));
}

function shortName(name: string) {
  return name.replace(' Body ', ' ');
}

/**
 * Your pick picker (docs/plans/PLAN_YOUR_PICK.md): category filters (Upper, Lower, Full
 * body, Core & other, Run, Pilates, Home, Travel) under a FOCUS filter (Build muscle, Core
 * Inspired, Home, Travel) over a dropdown of specific workouts →
 * (Yoga/Core/Pilates) Timed or Mark
 * done → Add to the week, or Swap for an unstarted program day. Holds no network
 * calls — the caller starts the session, same pattern as AltExerciseTakeover. The
 * caller mounts it only while open, so every open starts from a fresh choice.
 */
export default function YourPickSheet({
  open,
  weekNumber,
  swapTargets,
  initialSwapForDay = null,
  focuses,
  onStart,
  onClose,
}: {
  open: boolean;
  weekNumber: number;
  /** Pre-select "Swap for <day>" (a day card's Swap button). */
  initialSwapForDay?: number | null;
  /** Unstarted program days a pick can replace (`yourPickSwapTargets`). */
  swapTargets: WorkoutDay[];
  /** The athlete's focus for this week — the FOCUS filter starts on it. */
  focuses: Focuses;
  onStart: (choice: YourPickChoice) => void;
  onClose: () => void;
}) {
  const groups = useMemo(() => [...yourPickVariantGroups(), ...focusPickGroups()], []);
  // FOCUS filter (the athlete's own focus to start; tap more to widen) narrows the
  // categories; the Category filter narrows within it (null = every category shown).
  const [focusSel, setFocusSel] = useState<Focus[]>(() => [...focuses]);
  const [category, setCategory] = useState<string | null>(null);
  const [pickDay, setPickDay] = useState<number>(() => {
    const wanted = defaultYourPickVariant(weekNumber).dayNumber;
    const open = groupsInFocus(groups, focusSel).flatMap((group) => group.variants);
    return open.some((item) => item.dayNumber === wanted) ? wanted : (open[0]?.dayNumber ?? wanted);
  });
  const [pickMode, setPickMode] = useState<YourPickMode>('sets');
  const [swapForDay, setSwapForDay] = useState<number | null>(initialSwapForDay);

  const variant = groups.flatMap((group) => group.variants).find((item) => item.dayNumber === pickDay);
  const pickType: YourPickType = variant?.type ?? 'upper';
  const preview = useMemo(
    () => resolveYourPickDay(weekNumber, pickDay) ?? resolveFocusDay(weekNumber, pickDay),
    [weekNumber, pickDay]
  );
  const inFocus = groupsInFocus(groups, focusSel);
  const shownGroups = category ? inFocus.filter((group) => group.label === category) : inFocus;

  if (!open) return null;

  const chooseWorkout = (dayNumber: number) => {
    const next = groups.flatMap((group) => group.variants).find((item) => item.dayNumber === dayNumber);
    if (!next) return;
    setPickDay(dayNumber);
    setPickMode(pickModesFor(next.type)[0]);
  };
  /** Moves the pick to the first visible workout when the current one just got filtered out. */
  const keepPickVisible = (visibleGroups: YourPickVariantGroup[]) => {
    const visible = visibleGroups.flatMap((group) => group.variants);
    if (visible.length > 0 && !visible.some((item) => item.dayNumber === pickDay)) chooseWorkout(visible[0].dayNumber);
  };
  /** A category chip: shows only that category's workouts. */
  const chooseCategory = (label: string | null) => {
    setCategory(label);
    keepPickVisible(label ? inFocus.filter((group) => group.label === label) : inFocus);
  };
  /** A focus chip toggles it on or off (never off the last one) and resets the category. */
  const toggleFocus = (focus: Focus) => {
    const next = focusSel.includes(focus)
      ? focusSel.length > 1
        ? focusSel.filter((item) => item !== focus)
        : focusSel
      : [...focusSel, focus];
    setFocusSel(next);
    setCategory(null);
    keepPickVisible(groupsInFocus(groups, next));
  };
  const pill = (active: boolean) =>
    `min-h-11 rounded-2xl border px-3 text-sm font-black ${
      active ? 'border-[#e8c547] bg-[#e8c547] text-[#1a1404]' : 'border-white/15 text-[#f6f1e3]'
    }`;
  // Right side of the Add/Swap switch: the day's name once it's known (one target, or chosen).
  const swapTarget = swapTargets.find((day) => day.dayNumber === swapForDay) ?? (swapTargets.length === 1 ? swapTargets[0] : null);
  const swapLabel = swapTarget ? `Swap for ${shortName(swapTarget.name)}` : 'Swap for…';

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

        <p className="mt-5 text-[11px] font-black uppercase tracking-[0.16em] text-[#f6f1e3]/50">Focus</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Training focus">
          {FOCUS_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={focusSel.includes(option.id)}
              onClick={() => toggleFocus(option.id)}
              className={chipClass(focusSel.includes(option.id))}
            >
              {option.short}
            </button>
          ))}
        </div>

        <p className="mt-5 text-[11px] font-black uppercase tracking-[0.16em] text-[#f6f1e3]/50">Category</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Workout category">
          {[null, ...inFocus.map((group) => group.label)].map((label) => (
            <button
              key={label ?? 'all'}
              type="button"
              aria-pressed={category === label}
              onClick={() => chooseCategory(label)}
              className={chipClass(category === label)}
            >
              {label ?? 'All'}
            </button>
          ))}
        </div>

        <p className="mt-5 text-[11px] font-black uppercase tracking-[0.16em] text-[#f6f1e3]/50">Workout</p>
        <select
          value={pickDay}
          onChange={(event) => chooseWorkout(Number(event.target.value))}
          aria-label="Workout"
          className="mt-2 min-h-12 w-full rounded-2xl border border-[#e8c547] bg-[#1a1404] px-3 text-base font-black text-[#f6f1e3]"
        >
          {shownGroups.map((group) => (
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
            {preview && !isFlowPickType(pickType) ? (
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

        {pickModesFor(pickType).length > 1 ? (
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

        {swapTargets.length > 0 ? (
          <>
            <p className="mt-5 text-[11px] font-black uppercase tracking-[0.16em] text-[#f6f1e3]/50">This week</p>
            {/* One-row switch: add on top of the week, or stand in for an unstarted program day. */}
            <div className="mt-2 flex gap-1 rounded-full border border-white/15 p-[3px]" role="group" aria-label="Add or swap">
              <button
                type="button"
                aria-pressed={swapForDay == null}
                onClick={() => setSwapForDay(null)}
                className={segClass(swapForDay == null)}
              >
                Add to the week
              </button>
              <button
                type="button"
                aria-pressed={swapForDay != null}
                onClick={() => setSwapForDay(swapForDay ?? swapTargets[0].dayNumber)}
                className={segClass(swapForDay != null)}
              >
                {swapLabel}
              </button>
            </div>
            {/* Several days could be swapped out: pick which one. */}
            {swapForDay != null && swapTargets.length > 1 ? (
              <select
                value={swapForDay}
                onChange={(event) => setSwapForDay(Number(event.target.value))}
                aria-label="Program day to swap"
                className="mt-2 min-h-11 w-full rounded-2xl border border-white/15 bg-[#1a1404] px-3 text-sm font-black text-[#f6f1e3]"
              >
                {swapTargets.map((day) => (
                  <option key={day.dayNumber} value={day.dayNumber}>
                    Swap for {shortName(day.name)}
                  </option>
                ))}
              </select>
            ) : null}
          </>
        ) : null}

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
