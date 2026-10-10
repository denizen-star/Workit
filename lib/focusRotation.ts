import { pilatesFlow, yourPickCoreFlow, yourPickYogaFlow } from '@/lib/optionalCircuits';
import type { OptionalCircuitStep } from '@/lib/optionals';
import { HOME_PACKS, HOME_PACK_LABELS } from '@/lib/focusPacks';
import type { Focus, Focuses } from '@/lib/focus';
import { toTravelExercise } from '@/lib/travelExercises';
import type { WorkoutDay } from '@/lib/workoutData';
import { flowExercises, FULL_BODY_PACKS, YOUR_PICK_NAME, type YourPickVariantGroup } from '@/lib/yourPick';

/**
 * What a week looks like for each non-Build focus (docs/plans/PLAN_FOCUS_ONBOARDING.md).
 *
 * A focus's days in a week are numbered `base + ordinal` (core 110-114, home 120-124,
 * travel 130-134 — clear of the program's 1-8, Your pick's 20-99 and Test Drive's 30-32):
 * its first day of the week, its second, and so on. What a day holds depends only on the
 * week and that ordinal, never on how many days the athlete trains or which other focuses
 * they mix in, so a session row's (week, day) always re-resolves to the same workout.
 *
 * Rotations (slot i of week w):
 * - core:   Pilates A → Yoga → Pilates B → Core, shifted one step each week.
 * - home:   every slot alternates Full-Body 1 / 2 (A/B/A at 3 days, A/B/A/B/A at 5; the
 *           next week starts on B).
 * - travel: slots 0-2 travel full-body A/B/C rotating; slot 3 Pilates; slot 4 Core.
 *
 * Client-safe: no server imports.
 */
export type FocusProgram = Exclude<Focus, 'build'>;

export const FOCUS_DAY_BASE: Record<FocusProgram, number> = { core: 110, home: 120, travel: 130 };
/** Most days a week can hold — the schedule's own cap (`MAX_SCHEDULE_DAYS`). */
const FOCUS_SLOTS = 5;

type Content = 'pilatesA' | 'pilatesB' | 'yoga' | 'core' | 'home1' | 'home2' | 'travelA' | 'travelB' | 'travelC';

const CORE_CYCLE: Content[] = ['pilatesA', 'yoga', 'pilatesB', 'core'];
const HOME_CYCLE: Content[] = ['home1', 'home2'];
const TRAVEL_CYCLE: Content[] = ['travelA', 'travelB', 'travelC'];
const TRAVEL_FULL_BODY_SLOTS = 3;

function contentFor(focus: FocusProgram, weekNumber: number, slot: number): Content {
  const step = Math.max(0, weekNumber - 1) + slot;
  if (focus === 'core') return CORE_CYCLE[step % CORE_CYCLE.length];
  // Home: every day alternates Full-Body 1 / 2 (A/B/A at 3 days, A/B/A/B/A at 5, then B first next week).
  if (focus === 'home') return HOME_CYCLE[step % HOME_CYCLE.length];
  if (slot < TRAVEL_FULL_BODY_SLOTS) return TRAVEL_CYCLE[step % TRAVEL_CYCLE.length];
  return slot === TRAVEL_FULL_BODY_SLOTS ? (weekNumber % 2 === 1 ? 'pilatesA' : 'pilatesB') : 'core';
}

function travelPack(index: number) {
  return FULL_BODY_PACKS[index].map(toTravelExercise);
}

/** Steps for a tap-through content, null for a lifting day. */
function flowStepsFor(content: Content, weekNumber: number): OptionalCircuitStep[] | null {
  if (content === 'pilatesA') return pilatesFlow('a');
  if (content === 'pilatesB') return pilatesFlow('b');
  if (content === 'yoga') return yourPickYogaFlow(weekNumber);
  if (content === 'core') return yourPickCoreFlow(weekNumber);
  return null;
}

type Described = { name: string; focus: string; pick?: 'yoga' | 'core'; exercises?: WorkoutDay['exercises'] };

function describe(content: Content, weekNumber: number): Described {
  switch (content) {
    case 'pilatesA':
      return { name: 'Pilates A', focus: '30-minute mat Pilates · core and mobility', pick: 'core' };
    case 'pilatesB':
      return { name: 'Pilates B', focus: '30-minute mat Pilates · back body and hips', pick: 'core' };
    case 'yoga':
      return { name: 'Yoga', focus: '30-minute flow', pick: 'yoga' };
    case 'core':
      return { name: 'Core', focus: 'Core holds', pick: 'core' };
    case 'home1':
    case 'home2': {
      const index = content === 'home1' ? 0 : 1;
      return { name: `Home · ${HOME_PACK_LABELS[index]}`, focus: 'Full body · two dumbbells', exercises: HOME_PACKS[index] };
    }
    default: {
      const index = TRAVEL_CYCLE.indexOf(content);
      return {
        name: `Travel · Full Body ${String.fromCharCode(65 + index)}`,
        focus: 'Full body · no equipment',
        exercises: travelPack(index),
      };
    }
  }
}

/* ---------------------------------------------------------------------------
 * Named workouts for Your pick. A focus slot's content changes with the week, so a menu
 * entry like "Pilates A" needs a day number whose content never moves: 140-146. These are
 * Your pick sessions (counted like any pick), offered in every week a pick is allowed.
 * ------------------------------------------------------------------------- */

const NAMED_DAY_BASE = 140;

type NamedWorkout = { content: Content; label: string; group: string; type: 'core' | 'full'; description: string };

const NAMED_WORKOUTS: NamedWorkout[] = [
  { content: 'pilatesA', label: 'Pilates A', group: 'Pilates', type: 'core', description: '30-minute mat Pilates for core strength and mobility. A mat is all you need.' },
  { content: 'pilatesB', label: 'Pilates B', group: 'Pilates', type: 'core', description: '30-minute mat Pilates for the back body, obliques and hips. A mat is all you need.' },
  { content: 'home1', label: 'Full-Body 1', group: 'Home · 2 Dumbbells', type: 'full', description: 'Goblet squat, RDL, floor press, row, overhead press, lunge and a carry.' },
  { content: 'home2', label: 'Full-Body 2', group: 'Home · 2 Dumbbells', type: 'full', description: 'Split squat, sumo deadlift, renegade row, Arnold press, flyes, single-leg deadlift and woodchoppers.' },
  { content: 'travelA', label: 'Full Body A', group: 'Travel', type: 'full', description: 'No equipment. A squat, bench, row, hinge, press and a plank.' },
  { content: 'travelB', label: 'Full Body B', group: 'Travel', type: 'full', description: 'No equipment. A hinge, press, row, split squat, lateral raise and dead bugs.' },
  { content: 'travelC', label: 'Full Body C', group: 'Travel', type: 'full', description: 'No equipment. A bridge, pulldown, lunge, rear delts, a carry and a side plank.' },
];

function namedWorkout(dayNumber: number): NamedWorkout | null {
  return NAMED_WORKOUTS[dayNumber - NAMED_DAY_BASE] ?? null;
}

/** The Your pick dropdown's extra categories (Pilates, Home, Travel), same shape as
 * `yourPickVariantGroups` so the sheet treats them alike. */
export function focusPickGroups(): YourPickVariantGroup[] {
  const groups = new Map<string, YourPickVariantGroup>();
  NAMED_WORKOUTS.forEach((item, index) => {
    const group = groups.get(item.group) ?? { label: item.group, variants: [] };
    group.variants.push({ type: item.type, label: item.label, description: item.description, dayNumber: NAMED_DAY_BASE + index });
    groups.set(item.group, group);
  });
  return [...groups.values()];
}

/** Which Your pick categories (`YourPickVariantGroup.label`) each focus covers. Run suits
 * every focus, so it appears under all of them. */
const FOCUS_PICK_CATEGORIES: Record<Focus, readonly string[]> = {
  build: ['Upper', 'Lower', 'Full body', 'Run'],
  core: ['Core & other', 'Pilates', 'Run'],
  home: ['Home · 2 Dumbbells', 'Run'],
  travel: ['Travel', 'Run'],
};

/** The picker's categories for a set of focuses (the sheet's FOCUS filter row). */
export function pickCategoriesForFocuses(focuses: readonly Focus[]): Set<string> {
  return new Set(focuses.flatMap((focus) => FOCUS_PICK_CATEGORIES[focus]));
}

// Resolved days are static per week + day, so hand back the same object every time
// (the live session re-resolves on every render — see lib/yourPick.ts resolvedPickDays).
const resolvedDays = new Map<string, WorkoutDay | undefined>();

function focusOfDayNumber(dayNumber: number): { focus: FocusProgram; slot: number } | null {
  for (const focus of Object.keys(FOCUS_DAY_BASE) as FocusProgram[]) {
    const slot = dayNumber - FOCUS_DAY_BASE[focus];
    if (slot >= 0 && slot < FOCUS_SLOTS) return { focus, slot };
  }
  return null;
}

export function isFocusDayNumber(dayNumber: number): boolean {
  return focusOfDayNumber(Number(dayNumber)) != null;
}

/** The workout behind a focus day number in a program week; undefined for any other number. */
export function resolveFocusDay(weekNumber: number, dayNumber: number): WorkoutDay | undefined {
  const week = Number(weekNumber);
  const day = Number(dayNumber);
  const key = `${week}:${day}`;
  if (resolvedDays.has(key)) return resolvedDays.get(key);
  const where = focusOfDayNumber(day);
  const picked = namedWorkout(day);
  let resolved: WorkoutDay | undefined;
  if (picked) {
    const described = describe(picked.content, week);
    const steps = flowStepsFor(picked.content, week);
    resolved = {
      dayNumber: day,
      // Stored as workout_type: reads like every other Your pick ("Your pick · Pilates A").
      name: `${YOUR_PICK_NAME} · ${picked.content.startsWith('home') ? 'Home · ' : picked.content.startsWith('travel') ? 'Travel · ' : ''}${picked.label}`,
      focus: described.focus,
      suggestedDay: '',
      pick: picked.type,
      exercises: steps ? flowExercises(steps) : (described.exercises ?? []),
    };
  } else if (where) {
    const content = contentFor(where.focus, week, where.slot);
    const described = describe(content, week);
    const steps = flowStepsFor(content, week);
    resolved = {
      dayNumber: day,
      name: described.name,
      focus: described.focus,
      suggestedDay: '',
      pick: described.pick,
      exercises: steps ? flowExercises(steps) : (described.exercises ?? []),
    };
  }
  resolvedDays.set(key, resolved);
  return resolved;
}

/** The tap-through steps of a focus flow day (Pilates / Yoga / Core), null for a lifting day. */
export function focusFlowSteps(weekNumber: number, dayNumber: number): OptionalCircuitStep[] | null {
  const where = focusOfDayNumber(Number(dayNumber));
  return where ? flowStepsFor(contentFor(where.focus, Number(weekNumber), where.slot), Number(weekNumber)) : null;
}

/**
 * The week's required days when the athlete's focuses are not just Build muscle: one day
 * per day they train, alternating between their focuses (`focuses[(slot + lead) % n]`),
 * with the lead focus shifting each week so every focus gets first pick in turn. A focus's
 * days run through its own rotation in order (its first day of the week, its second, ...);
 * Build muscle's days are the week's real split days (`buildDays`, Upper A / Lower A ...).
 * One focus on its own is the same call with `n = 1`.
 */
export function focusWeekDays(focuses: Focuses, weekNumber: number, count: number, buildDays: WorkoutDay[]): WorkoutDay[] {
  const lead = Math.max(0, weekNumber - 1) % focuses.length;
  const used: Partial<Record<Focus, number>> = {};
  const days: WorkoutDay[] = [];
  for (let slot = 0; slot < Math.min(count, FOCUS_SLOTS); slot += 1) {
    const focus = focuses[(slot + lead) % focuses.length];
    const ordinal = used[focus] ?? 0;
    used[focus] = ordinal + 1;
    const day = focus === 'build' ? buildDays[ordinal] : resolveFocusDay(weekNumber, FOCUS_DAY_BASE[focus] + ordinal);
    if (day) days.push(day);
  }
  return days;
}

/** The POST /api/sessions body fields that start a focus flow day (Pilates, Yoga, Core)
 * through the Your pick path, timed; empty for every other day. */
export function focusFlowPick(pick: WorkoutDay['pick'], dayNumber: number) {
  if (!isFocusDayNumber(dayNumber) || (pick !== 'yoga' && pick !== 'core')) return {};
  return { pickType: pick, pickMode: 'timed' as const, pickDay: dayNumber, swapForDay: null };
}
