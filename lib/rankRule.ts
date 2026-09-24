import { clampScheduleDays } from '@/lib/scheduleDays';

/**
 * House ranking rule (docs/plans/PLAN_YOUR_PICK.md) — shared by The house boards
 * (7d / 30d / all time and the Your performance windows) and the weekly medals.
 *
 * 1. Eligible first: you met your own bar for the window — your weekly day count
 *    per full week in it (7d = 1×, 30d = 4×; a shorter window still needs 1), or at
 *    least one locked week for all time.
 * 2. Then average volume per session (effort-scaled sets + optional lbs + Your pick
 *    credit), so piling on extra sessions can't buy a rank.
 * Anyone short of the bar still ranks, below everyone who met it, by the same average.
 */

export type RankRow = {
  id: number;
  name: string;
  workouts: number;
  /** Display volume for the window: effort sets + optional + credit. */
  volume: number;
  /** `users.schedule_days_per_week`. */
  scheduleDays: number | null | undefined;
  /** Locked weeks all time (only read for the all-time window). */
  lockedWeeks?: number;
};

/** Sessions needed to be eligible in a window of `windowDays` (null = all time → none; the lock bar applies). */
export function requiredSessionsForWindow(scheduleDays: unknown, windowDays: number | null): number | null {
  if (windowDays == null) return null;
  return Math.max(1, clampScheduleDays(scheduleDays) * Math.floor(windowDays / 7));
}

export function rankEligible(row: RankRow, windowDays: number | null): boolean {
  const required = requiredSessionsForWindow(row.scheduleDays, windowDays);
  if (required == null) return Number(row.lockedWeeks || 0) >= 1;
  return Number(row.workouts || 0) >= required;
}

export function avgPerSession(row: Pick<RankRow, 'workouts' | 'volume'>): number {
  const workouts = Number(row.workouts || 0);
  return workouts > 0 ? Number(row.volume || 0) / workouts : 0;
}

/** Sort comparator: eligible first, then average per session, then more sessions, then name/id for stability. */
export function compareRank(a: RankRow, b: RankRow, windowDays: number | null): number {
  return (
    Number(rankEligible(b, windowDays)) - Number(rankEligible(a, windowDays)) ||
    avgPerSession(b) - avgPerSession(a) ||
    b.workouts - a.workouts ||
    a.name.localeCompare(b.name) ||
    a.id - b.id
  );
}
