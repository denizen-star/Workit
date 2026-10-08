import { query } from '@/lib/db';
import { liveExerciseName, parseExerciseAlts } from '@/lib/exerciseAlts';
import { parseExerciseModes } from '@/lib/exerciseModes';
import { refreshWeekLock } from '@/lib/lockedWeeks';
import { resolveSessionDay } from '@/lib/resolveDay';
import { isSkipExempt, isSkippedHeavy, SKIP_WINDOW_MS } from '@/lib/skippedSets';
import { normalizeWorkoutMode } from '@/lib/workoutMode';

/**
 * Server half of skipped sets (docs/plans/PLAN_SKIPPED_SETS.md; rule constants in
 * lib/skippedSets.ts). The server alone decides — the client's Skip button is a hint.
 */

type SessionRow = {
  week_number: number;
  day_number: number;
  workout_mode: string | null;
  exercise_modes: unknown;
  exercise_alts: unknown;
  is_completed: unknown;
};

/** Hyrox circuit movement under any name it can be logged as this session. */
function isCircuitMove(session: SessionRow, exerciseName: string): boolean {
  const day = resolveSessionDay(Number(session.week_number), Number(session.day_number));
  const alts = parseExerciseAlts(session.exercise_alts);
  const modes = parseExerciseModes(session.exercise_modes);
  const fallback = normalizeWorkoutMode(session.workout_mode);
  return (day?.exercises || []).some(
    (exercise) =>
      Boolean(exercise.circuitGroup) &&
      (exercise.name === exerciseName || liveExerciseName(exercise, alts, modes, fallback) === exerciseName)
  );
}

/**
 * A set's first completion: stamps `completed_at` and judges it. Skipped when another
 * set in the session completed under 25s ago, unless the movement is exempt (timed /
 * distance, Hyrox circuit). The session's first completed set has nothing to measure
 * from, so it never skips. Returns whether the set was skipped.
 */
export async function judgeFirstCompletion(setId: number, sessionId: number): Promise<boolean> {
  const [setResult, sessionResult, priorResult] = await Promise.all([
    query('SELECT exercise_name, target_reps FROM exercise_sets WHERE id = ? LIMIT 1', [setId]),
    query(
      `SELECT week_number, day_number, workout_mode, exercise_modes, exercise_alts, is_completed
       FROM workout_sessions WHERE id = ? LIMIT 1`,
      [sessionId]
    ),
    // `created_at` stands in for sets completed before `completed_at` existed.
    query(
      `SELECT MAX(COALESCE(completed_at, created_at)) > NOW() - INTERVAL ${SKIP_WINDOW_MS / 1000} SECOND AS recent
       FROM exercise_sets
       WHERE workout_session_id = ? AND is_completed = 1 AND id <> ?`,
      [sessionId, setId]
    ),
  ]);
  const set = setResult.rows[0] as { exercise_name?: string; target_reps?: string | null } | undefined;
  const session = sessionResult.rows[0] as SessionRow | undefined;
  const recent = Boolean(Number((priorResult.rows[0] as { recent?: unknown } | undefined)?.recent ?? 0));

  const name = String(set?.exercise_name || '');
  const exempt =
    isSkipExempt({ name, reps: String(set?.target_reps || '') }) || (session ? isCircuitMove(session, name) : false);
  const skipped = recent && !exempt;

  await query('UPDATE exercise_sets SET completed_at = NOW(), is_skipped = ? WHERE id = ?', [skipped ? 1 : 0, setId]);
  return skipped;
}

/** How much of the session's skip window is still open, in ms (0 when closed). Measured
 * on the server's own clock so a reloaded or remounted live card shows **Skip** for
 * exactly as long as `judgeFirstCompletion` will still judge a skip. */
export async function skipWindowRemainingMs(sessionId: number): Promise<number> {
  const result = await query(
    `SELECT TIMESTAMPDIFF(SECOND, MAX(COALESCE(completed_at, created_at)), NOW()) AS ago
     FROM exercise_sets WHERE workout_session_id = ? AND is_completed = 1`,
    [sessionId]
  );
  const ago = (result.rows[0] as { ago?: unknown } | undefined)?.ago;
  if (ago == null) return 0;
  return Math.max(0, SKIP_WINDOW_MS - Number(ago) * 1000);
}

/** Recounts a session's skipped share into `workout_sessions.skipped_heavy`. */
export async function refreshSkippedHeavy(sessionId: number): Promise<boolean> {
  const result = await query(
    `SELECT COUNT(*) AS completed, COALESCE(SUM(is_skipped), 0) AS skipped
     FROM exercise_sets WHERE workout_session_id = ? AND is_completed = 1`,
    [sessionId]
  );
  const row = result.rows[0] as { completed?: unknown; skipped?: unknown } | undefined;
  const heavy = isSkippedHeavy(Number(row?.completed || 0), Number(row?.skipped || 0));
  await query('UPDATE workout_sessions SET skipped_heavy = ? WHERE id = ?', [heavy ? 1 : 0, sessionId]);
  return heavy;
}

/**
 * Editing re-save of a skipped set: it counts again. On an already-finished session the
 * skipped share is recounted and the week lock re-checked, since that session may now
 * count toward its week. A locked week stays locked either way (lib/lockedWeeks.ts).
 */
export async function unskipSet(
  setId: number,
  sessionId: number,
  userId: number,
  scheduleDaysPerWeek: number
): Promise<void> {
  await query('UPDATE exercise_sets SET is_skipped = 0 WHERE id = ?', [setId]);
  const sessionResult = await query('SELECT week_number, is_completed FROM workout_sessions WHERE id = ? LIMIT 1', [
    sessionId,
  ]);
  const session = sessionResult.rows[0] as { week_number: number; is_completed: unknown } | undefined;
  if (!session || !Number(session.is_completed)) return;
  await refreshSkippedHeavy(sessionId);

  // Same routine as the Finish PUT (Test Drive and Hyrox weeks never lock).
  await refreshWeekLock({ userId, weekNumber: Number(session.week_number), scheduleDays: scheduleDaysPerWeek });
}
