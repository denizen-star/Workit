import { query } from '@/lib/db';
import { sqlInHousehold } from '@/lib/household';
import { completedInWeek } from '@/lib/bonusDay';
import { MAIN_PROGRAM_WEEKS, programTrackForWeek, trackForWeek } from '@/lib/programTrack';
import { requiredCountForWeek } from '@/lib/scheduleDays';
import { isTestDriveWeek } from '@/lib/testDrive';

/** Records that `weekNumber` met its bar for this athlete — a one-time, permanent
 * fact (`locked_weeks`, PK on user+week). Idempotent: safe to call on every
 * session completion in that week, not just the one that first crosses the
 * threshold. Once a row exists, `required_count` never changes, so a later
 * change to the athlete's `schedule_days_per_week` can't retroactively "unlock"
 * it — only `completed_count` keeps tracking the true total via extra sessions
 * (Do Again, etc.) landing in an already-locked week. No-ops below the bar. */
export async function recordWeekLockIfNeeded(
  userId: number,
  weekNumber: number,
  completedCount: number,
  requiredCount: number
): Promise<void> {
  if (completedCount < requiredCount) return;
  try {
    await query(
      `INSERT INTO locked_weeks (user_id, week_number, required_count, completed_count)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE completed_count = GREATEST(completed_count, VALUES(completed_count))`,
      [userId, weekNumber, requiredCount, completedCount]
    );
  } catch (error) {
    console.error('Error recording locked week:', error);
  }
}

/** The session columns week counting reads (`completedInWeek`, `coveredDayNumbers`,
 * Your pick / bonus rules) — one list, so a new rule never sees a partial row. */
export const SESSION_WEEK_COLUMNS =
  'id, week_number, day_number, workout_type, is_completed, skipped_heavy, pick_type, swap_for_day';

export type WeekSessionRow = {
  id: number;
  week_number: number;
  day_number: number;
  workout_type: string;
  is_completed: number | boolean;
  skipped_heavy: number | null;
  pick_type: string | null;
  swap_for_day: number | null;
};

/** One athlete's sessions on one track (or every track when omitted), week-counting columns. */
export async function loadWeekSessions(userId: number, track?: string): Promise<WeekSessionRow[]> {
  const result = await query(
    `SELECT ${SESSION_WEEK_COLUMNS} FROM workout_sessions WHERE user_id = ?${track ? ' AND program_track = ?' : ''}`,
    track ? [userId, track] : [userId]
  );
  return result.rows as WeekSessionRow[];
}

/**
 * The one week-lock routine (session mark-complete, Finish, an Editing un-skip): counts
 * the week's sessions that count (not skipped-heavy), and on a track that records locks
 * (lib/programTrack.ts `locksWeeks` — not Hyrox) persists the lock once it meets the
 * athlete's bar. Test Drive's week 0 never locks. `lockedWeeks` is the athlete's total
 * after recording — what a belt is matched against — and is null when nothing was
 * recorded, so a week that doesn't lock can never earn a belt.
 */
export async function refreshWeekLock(opts: {
  userId: number;
  weekNumber: number;
  scheduleDays: number;
  /** Already-loaded sessions for this athlete (any superset of the week). */
  sessions?: WeekSessionRow[];
}): Promise<{ locked: boolean; lockedWeeks: number | null }> {
  const { userId, weekNumber, scheduleDays } = opts;
  if (isTestDriveWeek(weekNumber)) return { locked: false, lockedWeeks: null };
  const sessions = opts.sessions ?? (await loadWeekSessions(userId, programTrackForWeek(weekNumber)));
  const completed = completedInWeek(sessions, weekNumber).length;
  const required = requiredCountForWeek(scheduleDays)(weekNumber);
  const locked = completed >= required;
  if (!locked || !trackForWeek(weekNumber).locksWeeks) return { locked, lockedWeeks: null };
  await recordWeekLockIfNeeded(userId, weekNumber, completed, required);
  return { locked, lockedWeeks: await lockedWeekCountFromTable(userId) };
}

export async function lockedWeekCountFromTable(userId: number): Promise<number> {
  const result = await query('SELECT COUNT(*) as n FROM locked_weeks WHERE user_id = ?', [userId]);
  return Number((result.rows[0] as { n?: number } | undefined)?.n || 0);
}

/** Locked weeks in the main 48-week program only. `locked_weeks` also holds Overload
 * Progressions weeks (201+), which count toward belts but never toward the 6-week
 * gates for Hyrox or Overload Progressions themselves. */
export async function lockedMainWeekCount(userId: number): Promise<number> {
  const result = await query(
    `SELECT COUNT(*) as n FROM locked_weeks WHERE user_id = ? AND week_number BETWEEN ${MAIN_PROGRAM_WEEKS.first} AND ${MAIN_PROGRAM_WEEKS.last}`,
    [userId]
  );
  return Number((result.rows[0] as { n?: number } | undefined)?.n || 0);
}

/** When the athlete's `n`th main-program week (1–48) locked — the moment a More
 * program opened (lib/programUnlock.ts). Null until they have `n` locked weeks. */
export async function nthMainWeekLockedAt(userId: number, n: number): Promise<string | null> {
  const result = await query(
    `SELECT locked_at FROM locked_weeks WHERE user_id = ? AND week_number BETWEEN ${MAIN_PROGRAM_WEEKS.first} AND ${MAIN_PROGRAM_WEEKS.last}
     ORDER BY locked_at ASC, week_number ASC LIMIT 1 OFFSET ?`,
    [userId, Math.max(0, n - 1)]
  );
  const row = result.rows[0] as { locked_at?: string | null } | undefined;
  return row?.locked_at ? String(row.locked_at) : null;
}

/** Every locked week_number for this athlete, ascending — used for streak math. */
export async function lockedWeekNumbers(userId: number): Promise<number[]> {
  const result = await query(
    'SELECT week_number FROM locked_weeks WHERE user_id = ? ORDER BY week_number ASC',
    [userId]
  );
  return (result.rows as { week_number: number }[]).map((row) => Number(row.week_number));
}

export type LockedWeekRecord = { weekNumber: number; requiredCount: number; completedCount: number };

/** Full locked-week rows (required/completed count as they were at lock time) —
 * lets a display recompute "N / N completed" for an already-locked week using the
 * requirement it actually locked under, instead of the athlete's current
 * `schedule_days_per_week`, which may have changed since (see the module comment
 * on `recordWeekLockIfNeeded`). */
export async function lockedWeekRecords(userId: number): Promise<LockedWeekRecord[]> {
  const result = await query(
    'SELECT week_number, required_count, completed_count FROM locked_weeks WHERE user_id = ? ORDER BY week_number ASC',
    [userId]
  );
  return (result.rows as { week_number: number; required_count: number; completed_count: number }[]).map(
    (row) => ({
      weekNumber: Number(row.week_number),
      requiredCount: Number(row.required_count),
      completedCount: Number(row.completed_count),
    })
  );
}

export async function lockedWeeksByUserFromTable(householdId?: number | null): Promise<Map<number, number>> {
  const house = sqlInHousehold('lw.user_id', householdId);
  const result = await query(
    `SELECT lw.user_id, COUNT(*) as locked FROM locked_weeks lw WHERE 1 = 1 ${house.sql} GROUP BY lw.user_id`,
    house.params
  );
  const map = new Map<number, number>();
  for (const row of result.rows as { user_id: number; locked: number }[]) {
    map.set(Number(row.user_id), Number(row.locked || 0));
  }
  return map;
}
