import { isBonusDay, requiredDays, weekHasBonus } from '@/lib/bonusDay';
import { workoutProgram, type Exercise, type WeekPlan, type WorkoutDay } from '@/lib/workoutData';

export const MIN_SCHEDULE_DAYS = 1;
export const MAX_SCHEDULE_DAYS = 5;
/** Matches `REQUIRED_DAYS_TO_LOCK` in `lib/bonusDay.ts` — the program's original fixed cadence. */
export const DEFAULT_SCHEDULE_DAYS = 4;

/** Clamp any stored/incoming value into the supported 1-5 range, falling back to the
 * default for anything missing or unparseable (including `null`/`undefined` — not
 * just NaN, since `Number(null)` is 0 and would otherwise clamp to the minimum). */
export function clampScheduleDays(value: unknown): number {
  if (value == null || value === '') return DEFAULT_SCHEDULE_DAYS;
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_SCHEDULE_DAYS;
  return Math.min(MAX_SCHEDULE_DAYS, Math.max(MIN_SCHEDULE_DAYS, n));
}

export function scheduleDaysForUser(user: { schedule_days_per_week?: unknown } | null | undefined): number {
  return clampScheduleDays(user?.schedule_days_per_week);
}

/** 1-3 day/week athletes train full-body instead of a split, so a short week never
 * leaves a muscle group untouched. Built from exercises already in the catalog. */
const FULL_BODY_PACKS: Exercise[][] = [
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

/** First full-body `dayNumber` — kept clear of 1-5 (normal program + bonus) and
 * Hyrox's 101+ namespace so `workout_sessions.day_number` never collides. */
const FULL_BODY_DAY_NUMBER_BASE = 6;

function fullBodyDay(week: WeekPlan, index: number): WorkoutDay {
  const pack = FULL_BODY_PACKS[(week.weekNumber + index) % FULL_BODY_PACKS.length];
  return {
    dayNumber: FULL_BODY_DAY_NUMBER_BASE + index,
    name: `Full Body ${String.fromCharCode(65 + index)}`,
    focus: 'Full body',
    suggestedDay: '',
    exercises: pack,
  };
}

/** The days that count toward this athlete's week — what `weekLocked`/`findNextProgramDay`
 * require and what Select Workout should offer as the week's plan. Does not touch the
 * optional bonus day, which stays available to everyone at 1-4 days regardless.
 *
 * - 4 days (default): unchanged, the program's normal 4 split days.
 * - 5 days: the 4 split days plus the week's bonus day, now required rather than optional.
 *   Weeks 1-2 have no bonus day, so this naturally falls back to 4 there.
 * - 1-3 days: that many full-body days, replacing the split entirely so a short week
 *   still hits every muscle group instead of risking e.g. two upper days with no legs.
 */
export function athleteRequiredDays(week: WeekPlan, scheduleDays: number): WorkoutDay[] {
  const count = clampScheduleDays(scheduleDays);
  if (count >= DEFAULT_SCHEDULE_DAYS) {
    const split = requiredDays(week);
    if (count >= MAX_SCHEDULE_DAYS && weekHasBonus(week)) {
      const bonus = week.days.find((day) => isBonusDay(day));
      return bonus ? [...split, bonus] : split;
    }
    return split;
  }
  return Array.from({ length: count }, (_, index) => fullBodyDay(week, index));
}

/** True if `day` is one of this athlete's full-body substitute days (dayNumber 6+). */
export function isFullBodyDay(day: Pick<WorkoutDay, 'dayNumber'>): boolean {
  return day.dayNumber >= FULL_BODY_DAY_NUMBER_BASE;
}

/** Full-body days aren't part of the static `workoutProgram` array (they're
 * synthesized per-athlete), so `getWorkoutDay` can't find them by week+day alone.
 * This reconstructs the same deterministic day for lookups keyed off an existing
 * `workout_sessions` row (e.g. re-deriving exercises for a Gym/Travel toggle). */
export function resolveFullBodyDay(weekNumber: number, dayNumber: number): WorkoutDay | undefined {
  if (dayNumber < FULL_BODY_DAY_NUMBER_BASE) return undefined;
  const week = workoutProgram.find((item) => item.weekNumber === weekNumber);
  return week ? fullBodyDay(week, dayNumber - FULL_BODY_DAY_NUMBER_BASE) : undefined;
}

/** Everything Select Workout should offer this athlete for the week: the required
 * days from `athleteRequiredDays`, plus the week's optional bonus day tacked on
 * (unless a 5-day athlete already has it folded into required). Bonus stays
 * available to every athlete regardless of chosen frequency. */
export function athleteWeekDays(week: WeekPlan, scheduleDays: number): WorkoutDay[] {
  const required = athleteRequiredDays(week, scheduleDays);
  if (required.some((day) => isBonusDay(day))) return required;
  const bonus = week.days.find((day) => isBonusDay(day));
  return bonus ? [...required, bonus] : required;
}

/** Curried `athleteRequiredDays` for passing into `findNextProgramDay`/`getTodayTarget`/
 * `defaultSelectWeek`'s `daysForWeek` param, bound to one athlete's chosen count. */
export function daysForWeekFn(scheduleDays: number): (week: WeekPlan) => WorkoutDay[] {
  return (week) => athleteRequiredDays(week, scheduleDays);
}

/** Home re-asks whether the athlete's day count still fits every 6 program weeks,
 * starting at week 7 (7, 13, 19, ...) — the same cadence the household agreed on. */
const SCHEDULE_DAYS_ASK_START_WEEK = 7;
const SCHEDULE_DAYS_ASK_INTERVAL_WEEKS = 6;

export function isScheduleDaysAskWeek(weekNumber: number): boolean {
  return (
    weekNumber >= SCHEDULE_DAYS_ASK_START_WEEK &&
    (weekNumber - SCHEDULE_DAYS_ASK_START_WEEK) % SCHEDULE_DAYS_ASK_INTERVAL_WEEKS === 0
  );
}

/** How many completed sessions week `weekNumber` needs to lock, for this athlete's
 * chosen count. Looks the week up in `workoutProgram` (falls back to `scheduleDays`
 * itself — capped at 4 — for anything outside the normal 1-48 range, e.g. Hyrox's
 * own 101+ weeks, which should never reach this path but stay safe if they do).
 * For passing into `recordWeekLockIfNeeded` (`lib/lockedWeeks.ts`) and similar
 * per-week-count SQL. */
export function requiredCountForWeek(scheduleDays: number): (weekNumber: number) => number {
  return (weekNumber) => {
    const week = workoutProgram.find((item) => item.weekNumber === weekNumber);
    return week ? athleteRequiredDays(week, scheduleDays).length : Math.min(scheduleDays, DEFAULT_SCHEDULE_DAYS);
  };
}
