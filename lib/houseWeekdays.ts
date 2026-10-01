import {
  addEasternCalendarDays,
  easternMidnightUtc,
  easternMondayKey,
  easternWeekday,
  sqlUtc,
} from '@/lib/analyticsTime';
import { query } from '@/lib/db';
import { sqlInHousehold } from '@/lib/household';
import { isTestUserName, SQL_EXCLUDE_TEST_USER } from '@/lib/householdUsers';
import { parseDbTime } from '@/lib/optionals';
import type { HouseWeekdayBlock, ScoreboardPeriod } from '@/lib/scoreboardTypes';
import { sqlNotTestDrive } from '@/lib/testDrive';

const EMPTY_DAYS = [0, 0, 0, 0, 0, 0, 0];

type FinishedSession = {
  userId: number;
  workoutType: string;
  completedAt: string | Date | null;
};

/**
 * Eastern weekday (0 = Sunday … 6 = Saturday) onto a Monday-first box.
 * Sunday lands in the last box so the row reads M T W T F S S.
 */
export function weekdayBoxIndex(weekday: number): number {
  return weekday === 0 ? 6 : weekday - 1;
}

/** Average rounded up. An empty pool stays 0 so we never divide by zero. */
export function ceilAverage(sum: number, count: number): number {
  if (count <= 0 || sum <= 0) return 0;
  return Math.ceil(sum / count);
}

/**
 * 7d is the current Eastern calendar week (Monday 00:00 through Sunday).
 * 30d and All time reuse the house window and later fold into weekday boxes.
 */
function weekdayWindow(period: ScoreboardPeriod): { sql: string; params: string[] } {
  if (period === 'all') return { sql: '', params: [] };
  if (period === '30') {
    return { sql: ' AND ws.completed_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY)', params: [] };
  }
  const monday = easternMondayKey(new Date());
  const start = sqlUtc(easternMidnightUtc(monday));
  const end = sqlUtc(easternMidnightUtc(addEasternCalendarDays(monday, 7)));
  return { sql: ' AND ws.completed_at >= ? AND ws.completed_at < ?', params: [start, end] };
}

/**
 * Fold finished sessions into the caller's row and the house averages.
 * Athletes with no finished workout in the window are absent here, so they
 * stay out of the divisor. A weekday they skipped still counts as zero
 * because every active athlete has a seven-box row.
 */
export function foldHouseWeekdays(
  sessions: FinishedSession[],
  viewer: { id: number; name: string }
): HouseWeekdayBlock {
  const byUser = new Map<number, { days: number[]; total: number; workouts: Map<string, number> | null }>();

  for (const session of sessions) {
    const ms = parseDbTime(session.completedAt);
    if (ms == null) continue;
    const box = weekdayBoxIndex(easternWeekday(new Date(ms)));
    let row = byUser.get(session.userId);
    if (!row) {
      row = {
        days: [...EMPTY_DAYS],
        total: 0,
        workouts: session.userId === viewer.id ? new Map() : null,
      };
      byUser.set(session.userId, row);
    }
    row.days[box] += 1;
    row.total += 1;
    if (row.workouts) {
      const name = String(session.workoutType || '').trim() || 'Workout';
      row.workouts.set(name, (row.workouts.get(name) || 0) + 1);
    }
  }

  const active = [...byUser.values()];
  const houseDays = [...EMPTY_DAYS];
  let totalSum = 0;
  for (const row of active) {
    totalSum += row.total;
    for (let i = 0; i < houseDays.length; i += 1) houseDays[i] += row.days[i];
  }
  const mine = byUser.get(viewer.id);
  const workouts = [...(mine?.workouts?.entries() ?? [])]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    you: {
      name: viewer.name,
      total: mine?.total ?? 0,
      days: mine?.days ?? [...EMPTY_DAYS],
      workouts,
    },
    house: {
      total: ceilAverage(totalSum, active.length),
      days: houseDays.map((sum) => ceilAverage(sum, active.length)),
    },
  };
}

/**
 * Finished workouts for The house weekday rows. Test gets nothing.
 * Test Drive sessions stay off, matching the rest of this page.
 * Other athletes' names never leave this function.
 */
export async function loadHouseWeekdays(
  period: ScoreboardPeriod,
  householdId: number | null,
  viewer: { id: number; name: string }
): Promise<HouseWeekdayBlock | null> {
  if (isTestUserName(viewer.name)) return null;
  const window = weekdayWindow(period);
  const house = sqlInHousehold('u.id', householdId);
  const result = await query(
    `SELECT ws.user_id, ws.workout_type, ws.completed_at
     FROM workout_sessions ws
     INNER JOIN users u ON u.id = ws.user_id
     WHERE ws.is_completed = 1
       AND ${SQL_EXCLUDE_TEST_USER}
       ${sqlNotTestDrive('ws')}
       ${window.sql}
       ${house.sql}`,
    [...window.params, ...house.params]
  );
  const sessions = (result.rows as { user_id: number; workout_type: string; completed_at: string | Date | null }[]).map(
    (row) => ({
      userId: Number(row.user_id),
      workoutType: row.workout_type,
      completedAt: row.completed_at,
    })
  );
  return foldHouseWeekdays(sessions, viewer);
}
