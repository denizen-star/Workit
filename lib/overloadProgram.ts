// Overload Progressions: opt-in 6-week hypertrophy track (docs/plans/PLAN_OVERLOAD_PROGRESSIONS.md).
// Our own adaptation of general hypertrophy principles (effort → overload → volume),
// not any book's program. The 10 day templates are the ones Kevin picked on the
// template pick page; every lift keeps the main program's exact exercise name so
// weight history, PRs, the next-load suggestion and media carry straight over.
//
// Week numbers are namespaced PER RUN at 201+: run 1 = 201-206, run 2 = 211-216, …
// (`overloadWeekNumber`). A repeat run therefore never collides with an earlier run
// in week_number-keyed tables — `locked_weeks` (PK user+week) especially, since
// Overload weeks count toward belts.
//
// Day numbers are fixed per template (1-10), not per split, so a session row always
// resolves to the same template even after the athlete changes days per week mid-run.
// The week's split (which templates count) follows the athlete's CURRENT
// schedule_days_per_week — see `overloadWeekPlan`.
import type { Exercise, WeekPlan, WorkoutDay } from '@/lib/workoutData';

export const OVERLOAD_WEEK_OFFSET = 200;
/** Weeks per run. */
export const OVERLOAD_WEEKS = 6;
/** Week-number band per run (only 6 used; 10 keeps them readable: 201, 211, 221…). */
const RUN_STRIDE = 10;
const OVERLOAD_WEEK_MAX = 999;

export function isOverloadWeek(weekNumber: number): boolean {
  const week = Number(weekNumber);
  return week > OVERLOAD_WEEK_OFFSET && week <= OVERLOAD_WEEK_MAX;
}

/** Stored week_number for week `week` (1-6) of run `run` (1+). */
export function overloadWeekNumber(run: number, week: number): number {
  return OVERLOAD_WEEK_OFFSET + (Math.max(1, run) - 1) * RUN_STRIDE + week;
}

/** 1-6: the "Week N" an athlete sees. */
export function overloadDisplayWeek(weekNumber: number): number {
  return ((Number(weekNumber) - OVERLOAD_WEEK_OFFSET - 1) % RUN_STRIDE) + 1;
}

/** Which run a stored week_number belongs to. */
export function overloadRunOf(weekNumber: number): number {
  return Math.floor((Number(weekNumber) - OVERLOAD_WEEK_OFFSET - 1) / RUN_STRIDE) + 1;
}

/* ---------- Lift roles: rep range + rest ---------- */

type Role = 'heavy' | 'secondary' | 'isolation';

const ROLE_SPEC: Record<Role, { reps: string; restSeconds: number }> = {
  heavy: { reps: '6-8', restSeconds: 180 },
  secondary: { reps: '8-12', restSeconds: 120 },
  isolation: { reps: '12-15', restSeconds: 75 },
};

/* ---------- The six-week ladder: sets + Aim per week ---------- */

type WeekSpec = {
  compoundSets: number;
  isoSets: number;
  /** How hard 1-5 target for every set that week. */
  effort: 3 | 4;
  /** Weeks 5-6 push the last isolation set further. */
  isoLastSet?: string;
  description: string;
};

const WEEK_SPEC: Record<number, WeekSpec> = {
  1: { compoundSets: 2, isoSets: 2, effort: 3, description: 'Technique · find working loads' },
  2: { compoundSets: 2, isoSets: 2, effort: 3, description: 'Technique · add a rep' },
  3: { compoundSets: 3, isoSets: 2, effort: 4, description: 'Effort' },
  4: { compoundSets: 3, isoSets: 3, effort: 4, description: 'Overload' },
  5: { compoundSets: 3, isoSets: 3, effort: 4, isoLastSet: 'last set about 1 rep left', description: 'Volume' },
  6: { compoundSets: 3, isoSets: 3, effort: 4, isoLastSet: 'last set to failure', description: 'Peak' },
};

/* ---------- Picked day templates ---------- */

const SQUAT = 'Barbell Back Squats or Goblet Squats';
const RDL = 'Romanian Deadlifts (RDLs)';
const DEAD = 'Trap Bar Deadlifts or Barbell Conventional Deadlifts';
const BENCH = 'Barbell or Dumbbell Bench Press';
const INCLINE = 'Incline Dumbbell Bench Press';
const OHP = 'Overhead Dumbbell Shoulder Press';
const ROW = 'Barbell or Chest-Supported Rows';
const CABLE_ROW = 'Seated Cable Row';
const DB_ROW = 'Single-Arm Dumbbell Rows';
const PULLDOWN = 'Lat Pulldown';
const PULLDOWN_OR_ROW = 'Lat Pulldowns or Cable Rows';
const STRAIGHT_ARM = 'Straight-Arm Pulldowns or Dumbbell Pullovers';
const LEG_PRESS = 'Leg Press';
const SPLIT_SQUAT = 'Bulgarian Split Squats';
const LUNGE = 'Walking Lunges';
const LEG_CURL = 'Leg Curl Machine or Swiss Ball Hamstring Curls';
const LEG_EXT = 'Leg Extension Machine or Goblet Step-Ups';
const CALF = 'Standing Calf Raises';
const LATERAL = 'Dumbbell Lateral Raises';
const FACE_PULL = 'Face Pulls';
const CURL = 'Dumbbell Biceps Curls';
const HAMMER = 'Hammer Curls';
const PUSHDOWN = 'Triceps Cable Pushdowns or Overhead Extensions';
const SKULL = 'Lying Triceps Extensions (Skull Crushers)';
const SHRUG = 'Dumbbell or Barbell Shrugs';
/** New to the app — Upper B needs a video + stills (lib/exerciseMedia.ts / exerciseImages.ts). */
const CABLE_FLY = 'Cable Chest Fly';

type Slot = [name: string, role: Role];
type Template = { dayNumber: number; name: string; focus: string; slots: Slot[] };

const H = 'heavy' as const;
const S = 'secondary' as const;
const I = 'isolation' as const;

/** Day numbers 1-10, one per template, stable across splits. */
const TEMPLATES: Template[] = [
  { dayNumber: 1, name: 'Full Body A', focus: 'Deadlift + incline',
    slots: [[DEAD, H], [INCLINE, S], [CABLE_ROW, S], [LEG_PRESS, S], [FACE_PULL, I], [PUSHDOWN, I], [CALF, I]] },
  { dayNumber: 2, name: 'Full Body B', focus: 'Hinge + overhead',
    slots: [[RDL, H], [OHP, H], [ROW, S], [SPLIT_SQUAT, S], [STRAIGHT_ARM, I], [LEG_CURL, I], [HAMMER, I]] },
  { dayNumber: 3, name: 'Full Body C', focus: 'Deadlift + lunges',
    slots: [[DEAD, H], [BENCH, S], [PULLDOWN_OR_ROW, S], [LUNGE, S], [LATERAL, I], [PUSHDOWN, I], [HAMMER, I]] },
  { dayNumber: 4, name: 'Upper A', focus: 'Row-led',
    slots: [[ROW, H], [INCLINE, S], [PULLDOWN, S], [OHP, S], [FACE_PULL, I], [HAMMER, I], [SKULL, I]] },
  { dayNumber: 5, name: 'Lower A', focus: 'Squat-led',
    slots: [[SQUAT, H], [RDL, S], [LEG_PRESS, S], [LEG_CURL, I], [LEG_EXT, I], [CALF, I]] },
  { dayNumber: 6, name: 'Upper B', focus: 'Incline-led',
    slots: [[INCLINE, H], [DB_ROW, S], [PULLDOWN_OR_ROW, S], [CABLE_FLY, I], [FACE_PULL, I], [CURL, I], [PUSHDOWN, I]] },
  { dayNumber: 7, name: 'Lower B', focus: 'RDL-led',
    slots: [[RDL, H], [LEG_PRESS, S], [LUNGE, S], [LEG_CURL, I], [LEG_EXT, I], [CALF, I]] },
  { dayNumber: 8, name: 'Push', focus: 'Flat bench push',
    slots: [[BENCH, H], [OHP, S], [INCLINE, S], [LATERAL, I], [PUSHDOWN, I], [SKULL, I]] },
  { dayNumber: 9, name: 'Pull', focus: 'Pulldown-led pull',
    slots: [[PULLDOWN, H], [CABLE_ROW, S], [STRAIGHT_ARM, I], [SHRUG, I], [FACE_PULL, I], [CURL, I]] },
  { dayNumber: 10, name: 'Legs', focus: 'Squat + RDL',
    slots: [[SQUAT, H], [RDL, S], [SPLIT_SQUAT, S], [LEG_EXT, I], [LEG_CURL, I], [CALF, I]] },
];

/** Which templates make up the week, by days per week (1-5). */
const SPLITS: Record<number, number[]> = {
  1: [1],
  2: [1, 2],
  3: [1, 2, 3],
  4: [4, 5, 6, 7],
  5: [4, 5, 8, 9, 10],
};

function clampWeek(week: number): number {
  return Math.min(OVERLOAD_WEEKS, Math.max(1, week));
}

function buildExercise([name, role]: Slot, spec: WeekSpec): Exercise {
  const iso = role === 'isolation';
  return {
    name,
    sets: iso ? spec.isoSets : spec.compoundSets,
    reps: ROLE_SPEC[role].reps,
    restSeconds: ROLE_SPEC[role].restSeconds,
    targetEffort: spec.effort,
    ...(iso && spec.isoLastSet ? { lastSetCue: spec.isoLastSet } : {}),
  };
}

function buildDay(template: Template, displayWeek: number): WorkoutDay {
  const spec = WEEK_SPEC[clampWeek(displayWeek)];
  return {
    dayNumber: template.dayNumber,
    name: template.name,
    focus: template.focus,
    suggestedDay: '',
    exercises: template.slots.map((slot) => buildExercise(slot, spec)),
  };
}

function splitFor(scheduleDays: number): number[] {
  const count = Math.min(5, Math.max(1, Math.round(Number(scheduleDays) || 4)));
  return SPLITS[count];
}

/** One stored Overload week, as this athlete's current day count sees it. */
export function overloadWeekPlan(weekNumber: number, scheduleDays: number): WeekPlan {
  const displayWeek = overloadDisplayWeek(weekNumber);
  const days = splitFor(scheduleDays).map((dayNumber) =>
    buildDay(TEMPLATES.find((item) => item.dayNumber === dayNumber)!, displayWeek)
  );
  return { weekNumber, description: WEEK_SPEC[clampWeek(displayWeek)].description, days };
}

/** All 6 weeks of one run — the `program` array `findNextProgramDay` walks. */
export function overloadProgram(run: number, scheduleDays: number): WeekPlan[] {
  return Array.from({ length: OVERLOAD_WEEKS }, (_, index) =>
    overloadWeekPlan(overloadWeekNumber(run, index + 1), scheduleDays)
  );
}

/** Day behind a session row, independent of the athlete's current split. */
export function getOverloadWorkoutDay(weekNumber: number, dayNumber: number): WorkoutDay | undefined {
  if (!isOverloadWeek(weekNumber)) return undefined;
  const template = TEMPLATES.find((item) => item.dayNumber === Number(dayNumber));
  return template ? buildDay(template, overloadDisplayWeek(weekNumber)) : undefined;
}

/** Diploma tiers (lib/overloadState.ts awards them as calendar weeks 2 / 4 / 6 end). */
export const OVERLOAD_DIPLOMA_NAMES: Record<number, string> = {
  1: 'Form Locked',
  2: 'Overload Earned',
  3: 'Peak Climbed',
};
