import { requiredDays } from '@/lib/bonusDay';
import { getLegacyBonusDay, workoutProgram, type WeekPlan, type WorkoutDay } from '@/lib/workoutData';
import { FULL_BODY_PACKS, YOUR_PICK_SLOT_DAYS, yourPickSlotDay } from '@/lib/yourPick';

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

/** First full-body `dayNumber` — kept clear of 1-5 (normal program + retired bonus),
 * Your pick's 20+ and Hyrox's 101+ namespace so `workout_sessions.day_number` never
 * collides. 1-3 day/week athletes train full-body instead of a split (`FULL_BODY_PACKS`,
 * lib/yourPick.ts), so a short week never leaves a muscle group untouched. */
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

/** Most days a week can require: 5 in weeks that used to carry a bonus day (3-48),
 * else 4 — so weeks 1-2 stay at 4 for everyone, a 5-day athlete included. */
function weekCap(week: WeekPlan): number {
  return getLegacyBonusDay(week.weekNumber, 5) ? MAX_SCHEDULE_DAYS : DEFAULT_SCHEDULE_DAYS;
}

/** The days that count toward this athlete's week — what `weekLocked`/`findNextProgramDay`
 * require and what Select Workout should offer as the week's plan.
 *
 * - 4-5 days: the program's split days, topped up to the athlete's count (capped by
 *   `weekCap`) with required Your pick tiles — any Your pick fills them. Weeks 1-6:
 *   4 split days (+1 Your pick at 5 days from week 3). Week 7+: 3 split days (Extra
 *   Upper is retired) + 1 Your pick at 4 days, + 2 at 5 days.
 * - 1-3 days: that many full-body days, replacing the split entirely so a short week
 *   still hits every muscle group instead of risking e.g. two upper days with no legs.
 *
 * Any week always locks at this many finished sessions of any kind; Your pick
 * (lib/yourPick.ts) is open to every athlete on top of these.
 */
export function athleteRequiredDays(week: WeekPlan, scheduleDays: number): WorkoutDay[] {
  const count = clampScheduleDays(scheduleDays);
  if (count >= DEFAULT_SCHEDULE_DAYS) {
    const split = requiredDays(week);
    const programDays = new Set(split.map((day) => day.dayNumber));
    const slotCount = Math.max(0, Math.min(count, weekCap(week)) - split.length);
    const slots = YOUR_PICK_SLOT_DAYS.filter((dayNumber) => !programDays.has(dayNumber))
      .slice(0, slotCount)
      .map((dayNumber) => yourPickSlotDay(dayNumber));
    return [...split, ...slots];
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

/** Everything Select Workout should offer this athlete as the week's plan. Same as
 * `athleteRequiredDays` now that the optional bonus day is retired — Your pick is
 * offered separately (an "Add a workout" row), not as a day in this list. */
export function athleteWeekDays(week: WeekPlan, scheduleDays: number): WorkoutDay[] {
  return athleteRequiredDays(week, scheduleDays);
}

/** Days-per-week slider hint (join wizard + Edit profile): the count is what locks
 * the week, then what the plan looks like at that count. */
export function scheduleDaysHint(scheduleDays: number): string {
  const count = clampScheduleDays(scheduleDays);
  const plan =
    count <= 3
      ? 'Full-body days so nothing gets skipped on a short week.'
      : count === MAX_SCHEDULE_DAYS
        ? 'The upper/lower plan plus Your pick days.'
        : 'The upper/lower plan; from week 7 one day is a Your pick.';
  return `The number of workouts locks your week — any mix counts. ${plan}`;
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
