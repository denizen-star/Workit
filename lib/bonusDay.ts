import { getRetiredDay, getWorkoutDay, workoutProgram, type WeekPlan, type WorkoutDay } from '@/lib/workoutData';
import { isYourPickSlot, sessionIsYourPick } from '@/lib/yourPick';

type SessionLike = {
  week_number: number;
  day_number: number;
  workout_type?: string | null;
  /** Your pick columns (docs/plans/PLAN_YOUR_PICK.md). */
  pick_type?: string | null;
  swap_for_day?: number | null;
  is_completed?: unknown;
  completed_at?: string | null;
  ended_at?: string | null;
  started_at?: string | null;
  created_at?: string | null;
};

function isComplete(session: { is_completed?: unknown }): boolean {
  return Boolean(Number(session.is_completed));
}

/** Four finished sessions lock a week. Any session counts: program days, Your picks,
 * Do Again, and (historically) the retired bonus day. */
export const REQUIRED_DAYS_TO_LOCK = 4;

export function isBonusDay(day: Pick<WorkoutDay, 'bonus' | 'name'>): boolean {
  if (day.bonus) return true;
  return isBonusWorkoutType(day.name);
}

export function isBonusWorkoutType(workoutType: string | null | undefined): boolean {
  return /\bbonus\b/i.test(String(workoutType || ''));
}

export function weekHasBonus(week: WeekPlan | null | undefined): boolean {
  return Boolean(week?.days.some((day) => isBonusDay(day)));
}

export function requiredDays(week: WeekPlan): WorkoutDay[] {
  return week.days.filter((day) => !isBonusDay(day));
}

/** Session is a retired bonus day (Bonus Upper / Bonus Core / a marked class) if the
 * type says so, or its program day was flagged. Bonus days are no longer offered
 * (Your pick replaced them), so this only ever matches sessions logged before that —
 * `getWorkoutDay` still resolves those legacy days for the default program. */
export function sessionIsBonus(
  session: Pick<SessionLike, 'week_number' | 'day_number' | 'workout_type'>,
  program: WeekPlan[] = workoutProgram
): boolean {
  if (isBonusWorkoutType(session.workout_type)) return true;
  const day =
    program === workoutProgram
      ? getWorkoutDay(Number(session.week_number), Number(session.day_number))
      : program
          .find((item) => item.weekNumber === Number(session.week_number))
          ?.days.find((item) => item.dayNumber === Number(session.day_number));
  return Boolean(day && isBonusDay(day));
}

/** Session sits on a day Your pick retired (a bonus day or week 7+'s Extra Upper). */
export function sessionIsRetiredDay(
  session: Pick<SessionLike, 'week_number' | 'day_number' | 'workout_type'>
): boolean {
  return (
    isBonusWorkoutType(session.workout_type) ||
    getRetiredDay(Number(session.week_number), Number(session.day_number)) != null
  );
}

export function bonusTypeSql(alias = 'ws'): string {
  return `LOWER(COALESCE(${alias}.workout_type, '')) LIKE '%bonus%'`;
}

export function completedInWeek(sessions: SessionLike[], weekNumber: number): SessionLike[] {
  return sessions.filter(
    (session) => isComplete(session) && Number(session.week_number) === weekNumber
  );
}

/**
 * Which of the week's days its finished sessions count as done — the single source for
 * "is this tile done" across Select Workout, WeekLock and next-day logic. A session
 * covers its own `day_number` (so a past Extra Upper / bonus session on 4 / 5 fills
 * that Your pick slot); a Your pick swap also covers the program day it stood in for
 * (`swap_for_day`); each Your pick add fills the next open Your pick slot tile in
 * `required` (`isYourPickSlot`). `spareAdds` = adds left over with no slot to fill —
 * they still count toward the week, just without a tile of their own.
 */
export function weekCoverage(
  sessions: SessionLike[],
  weekNumber: number,
  required: WorkoutDay[] = []
): { covered: Set<number>; spareAdds: number } {
  const covered = new Set<number>();
  let adds = 0;
  for (const session of completedInWeek(sessions, weekNumber)) {
    covered.add(Number(session.day_number));
    if (session.swap_for_day != null) covered.add(Number(session.swap_for_day));
    else if (sessionIsYourPick(session)) adds += 1;
  }
  for (const slot of required.filter((day) => isYourPickSlot(day))) {
    if (adds === 0) break;
    if (covered.has(slot.dayNumber)) continue;
    covered.add(slot.dayNumber);
    adds -= 1;
  }
  return { covered, spareAdds: adds };
}

export function coveredDayNumbers(
  sessions: SessionLike[],
  weekNumber: number,
  required: WorkoutDay[] = []
): Set<number> {
  return weekCoverage(sessions, weekNumber, required).covered;
}

export function yourPickCountInWeek(sessions: SessionLike[], weekNumber: number): number {
  return completedInWeek(sessions, weekNumber).filter((session) => sessionIsYourPick(session)).length;
}

/** "Bonus" now means the week went beyond its required count with a Your pick in it,
 * or (historically) a retired bonus day was finished that week — `isBonusWeek`, the
 * same rule the Bonus Day badge and honor roll use (lib/yourPickBonus.ts). */
export function weekBonusDone(
  sessions: SessionLike[],
  weekNumber: number,
  requiredCount: number,
  program: WeekPlan[] = workoutProgram
): boolean {
  return isBonusWeek(
    {
      completed: completedInWeek(sessions, weekNumber).length,
      picks: yourPickCountInWeek(sessions, weekNumber),
      legacyBonus: bonusCompletedInWeek(sessions, weekNumber, program) ? 1 : 0,
    },
    requiredCount
  );
}

/** requiredCount defaults to the normal program's fixed 4; pass a week-specific
 * count (e.g. `requiredDays(week).length`) for a program whose weeks don't all
 * have the same required-day count, like Hyrox's 5-day weeks. */
export function weekLocked(
  sessions: SessionLike[],
  weekNumber: number,
  requiredCount = REQUIRED_DAYS_TO_LOCK
): boolean {
  return completedInWeek(sessions, weekNumber).length >= requiredCount;
}

/** Locked weeks in a row, counting back from the latest week that exists. Rest days
 * do not break it. Takes the athlete's persisted locked week numbers (see
 * `lockedWeekNumbers` in `lib/lockedWeeks.ts`) rather than raw completed-day counts
 * — a week either locked (permanently, once) or it didn't, so this never needs to
 * re-evaluate against a required-day threshold itself. */
export function lockedWeekStreak(lockedWeekNumbers: Iterable<number>): number {
  const locked = new Set(lockedWeekNumbers);
  const latest = Math.max(1, ...workoutProgram.map((week) => week.weekNumber));
  let streak = 0;
  for (let week = latest; week >= 1; week--) {
    if (locked.has(week)) streak += 1;
    else if (streak > 0) break;
  }
  return streak;
}

export function bonusCompletedInWeek(
  sessions: SessionLike[],
  weekNumber: number,
  program: WeekPlan[] = workoutProgram
): boolean {
  return completedInWeek(sessions, weekNumber).some((session) => sessionIsBonus(session, program));
}

/**
 * The Bonus Day rule for one program week (badge, honor roll, Finish takeover):
 * a retired bonus day was finished that week, or the week went beyond its required
 * count with a Your pick in it. `requiredCount` is that week's bar for the athlete.
 */
export function isBonusWeek(
  week: { completed: number; picks: number; legacyBonus: number },
  requiredCount: number
): boolean {
  return week.legacyBonus > 0 || (week.picks > 0 && week.completed > requiredCount);
}

/** Unique bonus weeks (see `isBonusWeek`). Do Again does not add another. Without
 * `requiredForWeek`, only retired bonus sessions count (the pre-Your pick rule). */
export function bonusCount(
  sessions: SessionLike[],
  program: WeekPlan[] = workoutProgram,
  requiredForWeek?: (weekNumber: number) => number
): number {
  const weeks = new Map<number, { completed: number; picks: number; legacyBonus: number }>();
  for (const session of sessions) {
    if (!isComplete(session)) continue;
    const week = Number(session.week_number);
    const tally = weeks.get(week) || { completed: 0, picks: 0, legacyBonus: 0 };
    tally.completed += 1;
    if (sessionIsYourPick(session)) tally.picks += 1;
    if (sessionIsBonus(session, program)) tally.legacyBonus += 1;
    weeks.set(week, tally);
  }
  let count = 0;
  for (const [week, tally] of weeks) {
    const required = requiredForWeek ? requiredForWeek(week) : Number.POSITIVE_INFINITY;
    if (isBonusWeek(tally, required)) count += 1;
  }
  return count;
}

export function weekProgress(
  sessions: SessionLike[],
  week: WeekPlan,
  program: WeekPlan[] = workoutProgram,
  /** Which days count as required for this athlete's week. Defaults to the
   * program's own non-bonus days; pass `athleteRequiredDays(week, scheduleDays)`
   * (`lib/scheduleDays.ts`) to honor a chosen day count instead. */
  required: WorkoutDay[] = requiredDays(week),
  /** Persisted `locked_weeks` row for this week, if any (`lib/lockedWeeks.ts`).
   * A week that already locked did so under whatever day count was required at
   * the time — if `schedule_days_per_week` changes later, `required` above no
   * longer matches the day numbers those old completed sessions were logged
   * under, so live-matching against `sessions` would wrongly read back as 0
   * done. When a locked record is passed, trust it instead of recomputing. */
  lockedRecord?: { requiredCount: number; completedCount: number } | null
): { requiredDone: number; requiredTotal: number; bonusDone: boolean } {
  if (lockedRecord) {
    return {
      requiredDone: Math.min(lockedRecord.completedCount, lockedRecord.requiredCount),
      requiredTotal: lockedRecord.requiredCount,
      bonusDone: weekBonusDone(sessions, week.weekNumber, lockedRecord.requiredCount, program),
    };
  }
  const { covered, spareAdds } = weekCoverage(sessions, week.weekNumber, required);
  const coveredRequired = required.filter((day) => covered.has(day.dayNumber)).length;
  // Any N sessions lock the week, so a Your pick add with no slot left still counts.
  return {
    requiredDone: Math.min(required.length, coveredRequired + spareAdds),
    requiredTotal: required.length,
    bonusDone: weekBonusDone(sessions, week.weekNumber, required.length, program),
  };
}

export function lastCompletedSession(sessions: SessionLike[]): SessionLike | null {
  return (
    [...sessions]
      .filter(isComplete)
      .sort((a, b) => {
        const aTime = new Date(a.completed_at || a.ended_at || a.started_at || a.created_at || 0).getTime();
        const bTime = new Date(b.completed_at || b.ended_at || b.started_at || b.created_at || 0).getTime();
        return bTime - aTime;
      })[0] ?? null
  );
}

export function isUpperSession(
  session: Pick<SessionLike, 'week_number' | 'day_number' | 'workout_type'>,
  program: WeekPlan[] = workoutProgram
): boolean {
  if (sessionIsBonus(session, program)) return true;
  if (/\bupper\b/i.test(String(session.workout_type || ''))) return true;
  const day = getWorkoutDay(Number(session.week_number), Number(session.day_number));
  return Boolean(day && /\bupper\b/i.test(day.name));
}

/** Last finished session was an upper (A, B, or Bonus). Lower the next day is fine. */
export function shouldRestBetweenUppers(sessions: SessionLike[]): boolean {
  const last = lastCompletedSession(sessions);
  return Boolean(last && isUpperSession(last));
}

export function restBetweenUppersCopy(): string {
  return 'Leave a day between upper sessions. Lower the next day is fine.';
}

export function weekProgressLabel(progress: {
  requiredDone: number;
  requiredTotal: number;
  bonusDone: boolean;
}): string {
  // Count, not specific days: any mix of workouts locks the week.
  const base = `${progress.requiredDone} / ${progress.requiredTotal} workouts`;
  return progress.bonusDone ? `${base} + bonus` : base;
}
