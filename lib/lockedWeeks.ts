import { query } from '@/lib/db';
import { sqlInHousehold } from '@/lib/household';

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

export async function lockedWeekCountFromTable(userId: number): Promise<number> {
  const result = await query('SELECT COUNT(*) as n FROM locked_weeks WHERE user_id = ?', [userId]);
  return Number((result.rows[0] as { n?: number } | undefined)?.n || 0);
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
