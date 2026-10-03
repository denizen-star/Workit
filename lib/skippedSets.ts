import { getExerciseKind } from '@/lib/exerciseKind';
import type { Exercise } from '@/lib/workoutData';

/**
 * Skipped sets (docs/plans/PLAN_SKIPPED_SETS.md). A lifting set completed less than
 * 15 seconds after the session's previous completed set is stored completed but
 * skipped (`exercise_sets.is_skipped`): it still finishes its card, but counts for
 * nothing — volume, board, badges, Best/PR, set history, prefill, Last time. The
 * athlete only ever sees "Skipped", never the rule. Client-safe; the server half
 * (judging and the week rule) lives in lib/skippedSetsServer.ts.
 */
export const SKIP_WINDOW_MS = 15_000;

/** Half or more of a session's completed sets skipped → it doesn't count toward the week. */
export const SKIPPED_HEAVY_SHARE = 0.5;

/** Movements that are never skipped: timed / distance holds (Stop completes them) and
 * Hyrox circuit moves, which flow straight into each other with no rest between. The
 * session's first completed set is the third exemption — there's no previous set to
 * measure from, so callers get it for free. */
export function isSkipExempt(exercise: Pick<Exercise, 'name' | 'reps' | 'circuitGroup'>): boolean {
  const kind = getExerciseKind(exercise.name, exercise.reps || '');
  return kind === 'timed' || kind === 'distance' || Boolean(exercise.circuitGroup);
}

/** True when a set completed at `now` lands inside the skip window of the previous one. */
export function withinSkipWindow(lastCompletedAt: number | null, now: number = Date.now()): boolean {
  return lastCompletedAt != null && now - lastCompletedAt < SKIP_WINDOW_MS;
}

export function isSkippedHeavy(completedSets: number, skippedSets: number): boolean {
  return completedSets > 0 && skippedSets / completedSets >= SKIPPED_HEAVY_SHARE;
}

/** Truthy `is_skipped` from a DB row or a client set (MySQL hands back 0/1 or "0"/"1"). */
export function setIsSkipped(set: { is_skipped?: unknown } | null | undefined): boolean {
  return Boolean(Number(set?.is_skipped ?? 0));
}

/** A set that counts: completed and not skipped. Use in place of a bare
 * `is_completed = 1` wherever sets feed volume, records or history. */
export function sqlSetCounts(alias?: string): string {
  const col = (column: string) => (alias ? `${alias}.${column}` : column);
  return `(${col('is_completed')} = 1 AND ${col('is_skipped')} = 0)`;
}

/** A session that counts toward the week (not skipped-heavy). */
export function sqlSessionCountsForWeek(alias?: string): string {
  return `${alias ? `${alias}.` : ''}skipped_heavy = 0`;
}
