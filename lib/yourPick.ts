import type { OptionalCircuitStep } from '@/lib/optionals';
import { yourPickCoreFlow, yourPickYogaFlow } from '@/lib/optionalCircuits';
import { programWithRetiredDays, type Exercise, type WorkoutDay } from '@/lib/workoutData';
import { blockFor, EXTRA_UPPER_PACKS } from '@/lib/yearProgram';

/**
 * Your pick — replaces the retired bonus day (docs/plans/PLAN_YOUR_PICK.md).
 * Any week of the main program, an athlete can start an Upper, Lower, Yoga, Core
 * or Full body workout, as an extra (add) or in place of an unstarted program day
 * (swap). Every finished one counts toward the week lock like any other session.
 *
 * Your pick days are synthesized per week (rotating packs + that week's phase
 * note), never part of the static `workoutProgram` array — resolve them from a
 * session row with `resolveYourPickDay`.
 */

export type YourPickType = 'upper' | 'lower' | 'yoga' | 'core' | 'full';
/** sets = normal live session. timed = Yoga/Core tap-through. done = Yoga/Core mark done. */
export type YourPickMode = 'sets' | 'timed' | 'done';

export const YOUR_PICK_TYPES: YourPickType[] = ['upper', 'lower', 'yoga', 'core', 'full'];

const LABELS: Record<YourPickType, string> = {
  upper: 'Upper',
  lower: 'Lower',
  yoga: 'Yoga',
  core: 'Core',
  full: 'Full body',
};

const FOCUS: Record<YourPickType, string> = {
  upper: 'Arms, shoulders and back',
  lower: 'Legs and glutes',
  yoga: '30-minute flow',
  core: 'Core holds',
  full: 'Full body',
};

/** First Your pick `day_number`. One per type (20-24), clear of the program's 1-5,
 * full-body 6-8 and Hyrox's 101+ weeks, so `workout_sessions.day_number` never collides. */
export const YOUR_PICK_DAY_BASE = 20;

/** Required "any Your pick" tile day numbers, in fill order. Day 4 replaced week 7+'s
 * Extra Upper and day 5 the old bonus day, so past weeks' Extra Upper / bonus sessions
 * (logged on 4 / 5) still read as those tiles being done. In weeks 1-6 day 4 is a real
 * program day (Lower B), so only day 5 can be a slot there. Display-only, never
 * started directly — any Your pick add fills the next open slot. */
export const YOUR_PICK_SLOT_DAYS = [4, 5] as const;

/** Mark done needs this much wall clock before it can be finished. */
export const YOUR_PICK_DONE_MIN_SECONDS = 30 * 60;

export const YOUR_PICK_NAME = 'Your pick';

export function isYourPickType(value: unknown): value is YourPickType {
  return YOUR_PICK_TYPES.includes(value as YourPickType);
}

export function isYourPickMode(value: unknown): value is YourPickMode {
  return value === 'sets' || value === 'timed' || value === 'done';
}

/** Yoga and Core run as tap-through or mark done and earn credit instead of set volume. */
export function isTimedPickType(type: unknown): boolean {
  return type === 'yoga' || type === 'core';
}

/** Modes a type allows: lifting types only run as sets. */
export function pickModesFor(type: YourPickType): YourPickMode[] {
  return isTimedPickType(type) ? ['timed', 'done'] : ['sets'];
}

export function yourPickLabel(type: YourPickType): string {
  return LABELS[type];
}

/** Stored as `workout_sessions.workout_type`. Deliberately contains "Upper"/"Lower"
 * for Upper/Lower so the existing upper/lower session badges and rest hint count
 * them, and never contains "bonus" so it can't be mistaken for a retired bonus day. */
export function yourPickWorkoutType(type: YourPickType): string {
  return `${YOUR_PICK_NAME} · ${LABELS[type]}`;
}

export function yourPickDayNumber(type: YourPickType): number {
  return YOUR_PICK_DAY_BASE + YOUR_PICK_TYPES.indexOf(type);
}

export function pickTypeFromDayNumber(dayNumber: number): YourPickType | null {
  const variant = variantFromDayNumber(dayNumber);
  if (variant) return variant.type;
  return YOUR_PICK_TYPES[dayNumber - YOUR_PICK_DAY_BASE] ?? null;
}

export function isYourPickDayNumber(dayNumber: number): boolean {
  return pickTypeFromDayNumber(Number(dayNumber)) != null;
}

/** 1-3 day/week athletes' full-body days (lib/scheduleDays.ts) use exactly these three —
 * do not reorder or resize, or their rotation shifts under open sessions. */
export const FULL_BODY_PACKS: Exercise[][] = [
  [
    { name: 'Barbell Back Squats or Goblet Squats', sets: 3, reps: '8-10' },
    { name: 'Barbell or Dumbbell Bench Press', sets: 3, reps: '8-10' },
    { name: 'Single-Arm Dumbbell Rows', sets: 3, reps: '10-12 per arm' },
    { name: 'Romanian Deadlifts (RDLs)', sets: 3, reps: '8-10' },
    { name: 'Overhead Dumbbell Shoulder Press', sets: 3, reps: '8-10' },
    { name: 'Plank Hold', sets: 3, reps: '45 seconds' },
  ],
  [
    { name: 'Trap Bar Deadlifts or Barbell Conventional Deadlifts', sets: 3, reps: '6-8' },
    { name: 'Incline Dumbbell Bench Press', sets: 3, reps: '8-10' },
    { name: 'Barbell or Chest-Supported Rows', sets: 3, reps: '8-10' },
    { name: 'Bulgarian Split Squats', sets: 3, reps: '8-10 per leg' },
    { name: 'Dumbbell Lateral Raises', sets: 3, reps: '12-15' },
    { name: 'Dead Bugs', sets: 3, reps: '8 per side' },
  ],
  [
    { name: 'Barbell Hip Thrusts or Glute Bridges', sets: 3, reps: '10-12' },
    { name: 'Lat Pulldowns or Cable Rows', sets: 3, reps: '10-12' },
    { name: 'Walking Lunges', sets: 3, reps: '10 steps per leg' },
    { name: 'Face Pulls', sets: 3, reps: '12-15' },
    { name: "Farmer's Carries", sets: 3, reps: '40-meter walk' },
    { name: 'Side Plank', sets: 3, reps: '30 seconds' },
  ],
];

/** Your pick Full body: the three full-body packs plus two more. */
const FULL_PACKS: Exercise[][] = [
  ...FULL_BODY_PACKS,
  [
    { name: 'Leg Press', sets: 3, reps: '10-12' },
    { name: 'Overhead Dumbbell Shoulder Press', sets: 3, reps: '8-10' },
    { name: 'Seated Cable Row', sets: 3, reps: '10-12' },
    { name: 'Romanian Deadlifts (RDLs)', sets: 3, reps: '8-10' },
    { name: 'Incline Dumbbell Bench Press', sets: 3, reps: '8-10' },
    { name: 'Dead Bugs', sets: 3, reps: '8 per side' },
  ],
  [
    { name: 'Barbell Front Squat or Goblet Squat', sets: 3, reps: '8-10' },
    { name: 'Barbell or Dumbbell Bench Press', sets: 3, reps: '8-10' },
    { name: 'Lat Pulldown', sets: 3, reps: '10-12' },
    { name: 'Barbell Hip Thrusts or Glute Bridges', sets: 3, reps: '10-12' },
    { name: 'Hammer Curls', sets: 3, reps: '10-12' },
    { name: 'Plank Hold', sets: 3, reps: '45 seconds' },
  ],
];

/** Your pick Lower: six packs, all names already in the program or Hyrox so history,
 * PRs and media carry over. */
const LOWER_PACKS: Exercise[][] = [
  // Squat.
  [
    { name: 'Barbell Back Squats or Goblet Squats', sets: 4, reps: '8-10' },
    { name: 'Walking Lunges', sets: 3, reps: '10 steps per leg' },
    { name: 'Leg Extension Machine or Goblet Step-Ups', sets: 3, reps: '12' },
    { name: 'Standing Calf Raises', sets: 3, reps: '15' },
    { name: 'Pallof Press', sets: 3, reps: '12 per side' },
  ],
  // Hinge.
  [
    { name: 'Trap Bar Deadlifts or Barbell Conventional Deadlifts', sets: 4, reps: '6-8' },
    { name: 'Romanian Deadlifts (RDLs)', sets: 3, reps: '8-10' },
    { name: 'Leg Curl Machine or Swiss Ball Hamstring Curls', sets: 3, reps: '10-12' },
    { name: 'Barbell Hip Thrusts or Glute Bridges', sets: 3, reps: '10-12' },
    { name: "Farmer's Carries", sets: 3, reps: '40-meter walk' },
  ],
  // Single leg.
  [
    { name: 'Bulgarian Split Squats', sets: 3, reps: '8-10 per leg' },
    { name: 'Single-Leg Press', sets: 3, reps: '10 per leg' },
    { name: 'Walking Lunges', sets: 3, reps: '10 steps per leg' },
    { name: 'Leg Curl Machine or Swiss Ball Hamstring Curls', sets: 3, reps: '10-12' },
    { name: 'Standing Calf Raises', sets: 3, reps: '15' },
  ],
  // Glutes.
  [
    { name: 'Barbell Hip Thrusts or Glute Bridges', sets: 4, reps: '8-10' },
    { name: 'Romanian Deadlifts (RDLs)', sets: 3, reps: '10' },
    { name: 'Bulgarian Split Squats', sets: 3, reps: '10 per leg' },
    { name: 'Leg Extension Machine or Goblet Step-Ups', sets: 3, reps: '12' },
    { name: 'Pallof Press', sets: 3, reps: '12 per side' },
  ],
  // Machines.
  [
    { name: 'Leg Press', sets: 4, reps: '10-12' },
    { name: 'Leg Extension Machine or Goblet Step-Ups', sets: 3, reps: '12-15' },
    { name: 'Leg Curl Machine or Swiss Ball Hamstring Curls', sets: 3, reps: '12-15' },
    { name: 'Standing Calf Raises', sets: 4, reps: '15' },
    { name: "Farmer's Carries", sets: 3, reps: '40-meter walk' },
  ],
  // Front squat.
  [
    { name: 'Barbell Front Squat or Goblet Squat', sets: 4, reps: '8' },
    { name: 'Romanian Deadlifts (RDLs)', sets: 3, reps: '8-10' },
    { name: 'Walking Lunges', sets: 3, reps: '10 steps per leg' },
    { name: 'Barbell Hip Thrusts or Glute Bridges', sets: 3, reps: '10-12' },
    { name: 'Standing Calf Raises', sets: 3, reps: '15' },
  ],
];

const LIFT_POOLS: Record<'upper' | 'lower' | 'full', Exercise[][]> = {
  upper: EXTRA_UPPER_PACKS,
  lower: LOWER_PACKS,
  full: FULL_PACKS,
};

function rotate<T>(pool: T[], weekNumber: number): T {
  return pool[Math.max(0, weekNumber - 1) % pool.length];
}

/** Phase note for the week. Weeks 1-6 have no phase of their own and use Settle's. */
export function pickPhaseNote(weekNumber: number): string {
  return blockFor(Math.max(7, weekNumber)).note;
}

/** Tap-through steps for a Yoga/Core Your pick (empty for lifting types). */
export function yourPickSteps(weekNumber: number, type: YourPickType): OptionalCircuitStep[] {
  if (type === 'yoga') return yourPickYogaFlow(weekNumber);
  if (type === 'core') return yourPickCoreFlow(weekNumber);
  return [];
}

function exercisesFor(weekNumber: number, type: YourPickType): Exercise[] {
  if (isTimedPickType(type)) {
    // One row per hold so Select Workout can list the flow and estimate its length.
    return yourPickSteps(weekNumber, type).map((step) => ({
      name: step.title,
      sets: 1,
      reps: `${step.holdSeconds} seconds`,
      estimatedMinutes: Number(step.holdSeconds || 0) / 60,
    }));
  }
  const note = pickPhaseNote(weekNumber);
  return rotate(LIFT_POOLS[type as 'upper' | 'lower' | 'full'], weekNumber).map((exercise) => ({
    ...exercise,
    notes: note,
  }));
}

/** The Your pick day of `type` for a program week: rotating pack + phase note. */
export function yourPickDay(weekNumber: number, type: YourPickType): WorkoutDay {
  return {
    dayNumber: yourPickDayNumber(type),
    name: yourPickWorkoutType(type),
    focus: FOCUS[type],
    suggestedDay: '',
    pick: type,
    exercises: exercisesFor(weekNumber, type),
  };
}

/* ---------------------------------------------------------------------------
 * Specific workouts — the picker's grouped dropdown (Upper / Lower / Full body /
 * Core & other). Upper and Lower offer the week's own program days (Upper A/B,
 * Lower A/B) plus every pack; Full body every pack. Each lifting choice gets its
 * own day number so an open session resumes on exactly what was picked: upper
 * 40-59, lower 60-79, full 80-99 (clear of program 1-5, full body 6-8, the
 * rotating picks 20-24 still used by older sessions, and Test Drive 30-32).
 * Yoga and Core have one flow each and keep 22 / 23.
 * ------------------------------------------------------------------------- */

type LiftPickType = 'upper' | 'lower' | 'full';

const VARIANT_DAY_BASE: Record<LiftPickType, number> = { upper: 40, lower: 60, full: 80 };
const VARIANT_SPAN = 20;

/** Program days offered first under Upper / Lower, by their program name. */
const PROGRAM_VARIANTS: Record<LiftPickType, { label: string; dayName: string; description: string }[]> = {
  upper: [
    { label: 'Upper A', dayName: 'Upper Body A', description: 'Flat bench, overhead press, and a row.' },
    { label: 'Upper B', dayName: 'Upper Body B', description: 'Incline bench, a heavy row, then arms and rear delts.' },
  ],
  lower: [
    { label: 'Lower A', dayName: 'Lower Body A', description: 'Back squat plus an RDL.' },
    { label: 'Lower B', dayName: 'Lower Body B', description: 'Deadlift plus a split squat and a hip thrust.' },
  ],
  full: [],
};

/** Dropdown names for each pack, in pool order — keep in step with the pools above. */
const PACK_LABELS: Record<LiftPickType, string[]> = {
  upper: [
    'Traps and arms',
    'Shoulders and arms',
    'Light push and pull',
    'Traps, delts and arms',
    'Lats and arms',
    'Shoulders and back',
    'Chest and arms',
    'Traps, lats and arms',
  ],
  lower: ['Squat', 'Hinge', 'Single leg', 'Glutes', 'Machines', 'Front squat'],
  full: ['Full body A', 'Full body B', 'Full body C', 'Full body D', 'Full body E'],
};

/** One line on what sets each pack apart, shown above its lift list — same order as PACK_LABELS. */
const PACK_DESCRIPTIONS: Record<LiftPickType, string[]> = {
  upper: [
    'Shrugs and wrists. No press, no row.',
    'Side delts and face pulls, finished with a plank.',
    'The only pack with both a press and a row.',
    'Shrugs plus side delts.',
    'Straight-arm pulldown and face pulls. The only Pallof.',
    'Overhead press plus a row.',
    'Incline bench, no row.',
    'Shrugs, a straight-arm pulldown, and both arm moves.',
  ],
  lower: [
    'Back squat for 4 sets. No hinge.',
    'Deadlift for 4 sets, then an RDL. No squat or lunge.',
    'Split squat and single-leg press. No two-leg squat or deadlift.',
    'Hip thrust for 4 sets. No squat, no deadlift.',
    'Leg press. No free-weight squat, hinge, or lunge.',
    'Front squat, RDL, lunge, and hip thrust in one session.',
  ],
  full: [
    'Free squat plus both a flat bench and an overhead press.',
    'The only deadlift day. Shoulder work is a lateral raise.',
    'Hip thrust and a lunge. No press.',
    'Leg press, overhead press, and incline bench.',
    'Front squat, flat bench, and a hip thrust, plus hammer curls.',
  ],
};

const TIMED_DESCRIPTIONS: Record<'core' | 'yoga', string> = {
  core: '12 core holds, 75 seconds each.',
  yoga: '15 poses, 2 minutes each. A 30-minute flow.',
};

export type YourPickVariant = {
  type: YourPickType;
  /** What the dropdown shows. */
  label: string;
  /** The day number the session is stored on. */
  dayNumber: number;
  /** One line on what sets it apart, shown above the lift list. */
  description: string;
};

export type YourPickVariantGroup = { label: string; variants: YourPickVariant[] };

function liftVariants(type: LiftPickType): YourPickVariant[] {
  const items = [
    ...PROGRAM_VARIANTS[type],
    ...PACK_LABELS[type].map((label, index) => ({ label, description: PACK_DESCRIPTIONS[type][index] })),
  ];
  return items.map((item, index) => ({
    type,
    label: item.label,
    description: item.description,
    dayNumber: VARIANT_DAY_BASE[type] + index,
  }));
}

/** Every specific workout the picker offers, grouped for the dropdown. */
export function yourPickVariantGroups(): YourPickVariantGroup[] {
  return [
    { label: 'Upper', variants: liftVariants('upper') },
    { label: 'Lower', variants: liftVariants('lower') },
    { label: 'Full body', variants: liftVariants('full') },
    {
      label: 'Core & other',
      variants: (['core', 'yoga'] as const).map((type) => ({
        type,
        label: LABELS[type],
        description: TIMED_DESCRIPTIONS[type],
        dayNumber: yourPickDayNumber(type),
      })),
    },
  ];
}

/** The dropdown's starting choice for a week: the Upper pack the week used to rotate to. */
export function defaultYourPickVariant(weekNumber: number): YourPickVariant {
  const variants = liftVariants('upper');
  const offset = PROGRAM_VARIANTS.upper.length;
  return variants[offset + (Math.max(0, weekNumber - 1) % PACK_LABELS.upper.length)];
}

function variantFromDayNumber(dayNumber: number): { type: LiftPickType; index: number } | null {
  const day = Number(dayNumber);
  for (const type of Object.keys(VARIANT_DAY_BASE) as LiftPickType[]) {
    const index = day - VARIANT_DAY_BASE[type];
    if (index >= 0 && index < VARIANT_SPAN) {
      return index < PROGRAM_VARIANTS[type].length + LIFT_POOLS[type].length ? { type, index } : null;
    }
  }
  return null;
}

/** True for a specific-workout day number this build knows (40-99 range). */
export function isYourPickVariantDayNumber(dayNumber: number): boolean {
  return variantFromDayNumber(dayNumber) != null;
}

/** The week's version of a program day (e.g. Lower Body B). Weeks 7+ carry one lower
 * a week, so walk back to the nearest week that has it. */
function programDayFor(weekNumber: number, dayName: string): WorkoutDay | undefined {
  for (let week = Math.min(Math.max(1, weekNumber), YOUR_PICK_LAST_WEEK); week >= 1; week -= 1) {
    const found = programWithRetiredDays
      .find((item) => item.weekNumber === week)
      ?.days.find((day) => day.name === dayName);
    if (found) return found;
  }
  return undefined;
}

function variantDay(weekNumber: number, dayNumber: number): WorkoutDay | undefined {
  const variant = variantFromDayNumber(dayNumber);
  if (!variant) return undefined;
  const { type, index } = variant;
  const programs = PROGRAM_VARIANTS[type];
  let label: string;
  let exercises: Exercise[];
  if (index < programs.length) {
    const source = programDayFor(weekNumber, programs[index].dayName);
    if (!source) return undefined;
    label = programs[index].label;
    exercises = source.exercises.map((exercise) => ({ ...exercise }));
  } else {
    const packIndex = index - programs.length;
    // Full body packs are already named "Full body A"; the others read "Lower · Hinge".
    label = type === 'full' ? PACK_LABELS.full[packIndex] : `${LABELS[type]} · ${PACK_LABELS[type][packIndex]}`;
    const note = pickPhaseNote(weekNumber);
    exercises = LIFT_POOLS[type][packIndex].map((exercise) => ({ ...exercise, notes: note }));
  }
  return {
    dayNumber,
    // Stored as workout_type: keeps "Upper"/"Lower" in it for the badge/rest-hint
    // checks (see yourPickWorkoutType), and names the exact workout picked.
    name: `${YOUR_PICK_NAME} · ${label}`,
    focus: FOCUS[type],
    suggestedDay: '',
    pick: type,
    exercises,
  };
}

/** Re-derive a Your pick day from a session row's week + day number. */
export function resolveYourPickDay(weekNumber: number, dayNumber: number): WorkoutDay | undefined {
  const variant = variantDay(Number(weekNumber), Number(dayNumber));
  if (variant) return variant;
  const type = YOUR_PICK_TYPES[Number(dayNumber) - YOUR_PICK_DAY_BASE];
  return type ? yourPickDay(Number(weekNumber), type) : undefined;
}

/** A required "any Your pick" tile (see YOUR_PICK_SLOT_DAYS). */
export function yourPickSlotDay(dayNumber: number): WorkoutDay {
  return {
    dayNumber,
    name: YOUR_PICK_NAME,
    focus: 'Upper, Lower, Yoga, Core or Full body',
    suggestedDay: 'Saturday',
    pick: 'slot',
    exercises: [],
  };
}

export function isYourPickSlot(day: Pick<WorkoutDay, 'pick'> | null | undefined): boolean {
  return day?.pick === 'slot';
}

/** A session row is a Your pick if it was stored with a pick type or on a pick day number. */
export function sessionIsYourPick(session: { pick_type?: string | null; day_number?: number | null }): boolean {
  return isYourPickType(session.pick_type) || isYourPickDayNumber(Number(session.day_number));
}

/* ---------------------------------------------------------------------------
 * Start rules — shared by the Your pick sheet (client) and POST /api/sessions
 * (server), so both always agree on what can be started where.
 * ------------------------------------------------------------------------- */

type PickSessionLike = {
  week_number: number;
  day_number: number;
  is_completed?: unknown;
  swap_for_day?: number | null;
};

/** Last week of the main program. Hyrox weeks (101+) never take a Your pick. */
export const YOUR_PICK_LAST_WEEK = 48;

/**
 * The athlete's current program week for Your pick filing: the later of the first
 * week that isn't locked yet and the latest week they've logged any session in (so a
 * Hyrox returner resuming at week 20 isn't pinned to a skipped early week).
 */
export function yourPickCurrentWeek(sessions: PickSessionLike[], lockedWeeks: Iterable<number>): number {
  const locked = new Set(lockedWeeks);
  let firstOpen = 1;
  while (firstOpen < YOUR_PICK_LAST_WEEK && locked.has(firstOpen)) firstOpen += 1;
  const latestLogged = Math.max(
    0,
    ...sessions
      .map((session) => Number(session.week_number))
      .filter((week) => week >= 1 && week <= YOUR_PICK_LAST_WEEK)
  );
  return Math.max(firstOpen, latestLogged);
}

/** A Your pick is filed under the week being viewed, but only the current week or an
 * earlier week that isn't locked yet — never a future week (that would let anyone
 * lock week 30 early and walk up the belts). */
export function yourPickWeekAllowed(
  weekNumber: number,
  sessions: PickSessionLike[],
  lockedWeeks: Iterable<number>
): boolean {
  const locked = new Set(lockedWeeks);
  const week = Number(weekNumber);
  if (!Number.isInteger(week) || week < 1 || week > YOUR_PICK_LAST_WEEK) return false;
  if (locked.has(week)) return false;
  return week <= yourPickCurrentWeek(sessions, locked);
}

/** Program days of `requiredDays` a Your pick can swap in for: real program days (not
 * the Your pick slot) with no session at all yet — open, finished, or already swapped. */
export function yourPickSwapTargets(
  weekNumber: number,
  requiredDays: WorkoutDay[],
  sessions: PickSessionLike[]
): WorkoutDay[] {
  const touched = new Set<number>();
  for (const session of sessions) {
    if (Number(session.week_number) !== Number(weekNumber)) continue;
    touched.add(Number(session.day_number));
    if (session.swap_for_day != null) touched.add(Number(session.swap_for_day));
  }
  return requiredDays.filter((day) => !day.pick && !touched.has(day.dayNumber));
}

/**
 * Whole-session How hard for a Yoga/Core Your pick (1-5, stored in
 * `workout_sessions.session_hardness`): each hold tapped complete keeps its own
 * rating; holds the timer moved on from all take the one end-of-session rating.
 * Mark done is just the end rating. Null until every hold is covered by a rating.
 */
export function pickSessionHardness(
  tappedRatings: number[],
  timerHolds: number,
  endRating: number | null
): number | null {
  if (timerHolds > 0 && endRating == null) return null;
  const total = tappedRatings.length + timerHolds;
  if (total === 0) return endRating;
  const sum = tappedRatings.reduce((acc, value) => acc + value, 0) + (endRating ?? 0) * timerHolds;
  return Math.round((sum / total) * 100) / 100;
}
