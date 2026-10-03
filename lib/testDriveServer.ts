import { query } from '@/lib/db';
import { sqlSetVolume } from '@/lib/exerciseKind';
import { sqlSessionOptionalVolume } from '@/lib/optionals';
import { accountGetsTestDrive, TEST_DRIVE_WEEK, testDriveState, type TestDriveState } from '@/lib/testDrive';
import type { WorkoutDay } from '@/lib/workoutData';
import { sqlSetCounts } from '@/lib/skippedSets';

/** Server side of Test Drive (lib/testDrive.ts): load its state, validate a start, clean up after Monday. */

type TestDriveSessionRow = {
  week_number: number;
  day_number: number;
  is_completed: number | boolean;
  started_at: string | null;
  created_at: string | null;
};

async function loadSessionRows(userId: number): Promise<TestDriveSessionRow[]> {
  const result = await query(
    `SELECT week_number, day_number, is_completed, started_at, created_at
     FROM workout_sessions WHERE user_id = ?`,
    [userId]
  );
  return result.rows as TestDriveSessionRow[];
}

export async function loadTestDriveState(
  user: { id: number; createdAt?: string | Date | null },
  rows?: TestDriveSessionRow[]
): Promise<TestDriveState | null> {
  if (!accountGetsTestDrive(user.createdAt)) return null;
  return testDriveState(user.createdAt, rows ?? (await loadSessionRows(user.id)));
}

/**
 * A Test Drive start is valid only while it's active, for an allotted day that isn't
 * finished yet. The day (and so `workout_type`) comes from the server, never the client.
 */
export async function validateTestDriveStart(
  user: { id: number; createdAt?: string | Date | null },
  dayNumber: number
): Promise<{ ok: true; day: WorkoutDay } | { ok: false; error: string }> {
  const state = await loadTestDriveState(user);
  if (!state?.active) return { ok: false, error: 'Test Drive is not open' };
  const day = state.days.find((item) => item.dayNumber === Number(dayNumber));
  if (!day) return { ok: false, error: 'Not a Test Drive day' };
  if (state.doneDayNumbers.includes(day.dayNumber)) return { ok: false, error: 'Already done' };
  return { ok: true, day };
}

/** Program weeks wait for Monday while a Test Drive is on — a Week 1 start mid-week
 * would otherwise file work into Week 1 early and end the Test Drive. */
export async function programStartBlocked(user: { id: number; createdAt?: string | Date | null }): Promise<boolean> {
  return Boolean((await loadTestDriveState(user))?.active);
}

export type TestDriveSummary = { workouts: number; lbs: number; seconds: number };

/** Home's done hero: finished Test Drive workouts, their lbs (sets + optional) and time. */
export async function testDriveSummary(userId: number): Promise<TestDriveSummary> {
  const result = await query(
    `SELECT COUNT(*) as workouts,
            COALESCE(SUM((SELECT COALESCE(SUM(${sqlSetVolume('es')}), 0) FROM exercise_sets es
                          WHERE es.workout_session_id = ws.id AND ${sqlSetCounts('es')})
                         + ${sqlSessionOptionalVolume('ws')}), 0) as lbs,
            COALESCE(SUM(CASE WHEN ws.started_at IS NOT NULL AND ws.ended_at IS NOT NULL
                              THEN TIMESTAMPDIFF(SECOND, ws.started_at, ws.ended_at) END), 0) as seconds
     FROM workout_sessions ws
     WHERE ws.user_id = ? AND ws.week_number = ? AND ws.is_completed = 1`,
    [userId, TEST_DRIVE_WEEK]
  );
  const row = (result.rows[0] || {}) as { workouts?: number; lbs?: number; seconds?: number };
  return { workouts: Number(row.workouts || 0), lbs: Number(row.lbs || 0), seconds: Number(row.seconds || 0) };
}

/** Week 1 has started: an open Test Drive session is thrown away (with its sets). */
export async function deleteOpenTestDriveSessions(userId: number): Promise<number> {
  const open = await query(
    `SELECT id FROM workout_sessions
     WHERE user_id = ? AND week_number = ? AND (is_completed = 0 OR is_completed IS NULL)`,
    [userId, TEST_DRIVE_WEEK]
  );
  const ids = (open.rows as Array<{ id: number }>).map((row) => Number(row.id));
  for (const id of ids) {
    await query('DELETE FROM exercise_sets WHERE workout_session_id = ?', [id]);
    await query('DELETE FROM workout_sessions WHERE id = ? AND user_id = ?', [id, userId]);
  }
  return ids.length;
}
