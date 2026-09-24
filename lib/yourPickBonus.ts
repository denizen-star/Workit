import { bonusTypeSql, isBonusWeek } from '@/lib/bonusDay';
import { query } from '@/lib/db';
import { requiredCountForWeek } from '@/lib/scheduleDays';
import { YOUR_PICK_DAY_BASE, YOUR_PICK_TYPES } from '@/lib/yourPick';

/** SQL: this session is a Your pick (typed, or on a Your pick day number). */
export function sqlIsYourPick(alias = 'ws'): string {
  const last = YOUR_PICK_DAY_BASE + YOUR_PICK_TYPES.length - 1;
  return `(${alias}.pick_type IS NOT NULL OR ${alias}.day_number BETWEEN ${YOUR_PICK_DAY_BASE} AND ${last})`;
}

/**
 * Bonus weeks per athlete (docs/plans/PLAN_YOUR_PICK.md): weeks with a retired bonus
 * day, or weeks where a Your pick took them past their own required count — the
 * `isBonusWeek` rule, judged against each athlete's `schedule_days_per_week`.
 * `where` narrows sessions (window, household, one user); main program only.
 */
export async function bonusWeeksByUser(where = '', params: unknown[] = []): Promise<Map<number, number>> {
  const result = await query(
    `SELECT ws.user_id, u.schedule_days_per_week, ws.week_number,
            COUNT(*) AS completed,
            SUM(CASE WHEN ${sqlIsYourPick('ws')} THEN 1 ELSE 0 END) AS picks,
            SUM(CASE WHEN ${bonusTypeSql('ws')} THEN 1 ELSE 0 END) AS legacy_bonus
     FROM workout_sessions ws
     INNER JOIN users u ON u.id = ws.user_id
     WHERE ws.is_completed = 1 AND ws.program_track = 'main' ${where}
     GROUP BY ws.user_id, u.schedule_days_per_week, ws.week_number`,
    params
  );
  const counts = new Map<number, number>();
  for (const row of result.rows as {
    user_id: number;
    schedule_days_per_week: number | null;
    week_number: number;
    completed: number;
    picks: number;
    legacy_bonus: number;
  }[]) {
    const required = requiredCountForWeek(Number(row.schedule_days_per_week ?? 4))(Number(row.week_number));
    const bonus = isBonusWeek(
      { completed: Number(row.completed), picks: Number(row.picks), legacyBonus: Number(row.legacy_bonus) },
      required
    );
    if (bonus) counts.set(Number(row.user_id), (counts.get(Number(row.user_id)) || 0) + 1);
  }
  return counts;
}

export async function bonusWeeksForUser(userId: number): Promise<number> {
  return (await bonusWeeksByUser('AND ws.user_id = ?', [userId])).get(userId) || 0;
}

/** Counts behind the Your pick badges (lib/badges.ts). */
export async function yourPickBadgeStats(userId: number) {
  const result = await query(
    `SELECT
       SUM(CASE WHEN ${sqlIsYourPick('ws')} THEN 1 ELSE 0 END) AS picks,
       COUNT(DISTINCT ws.pick_type) AS pick_types,
       SUM(CASE WHEN ws.pick_type = 'yoga' THEN 1 ELSE 0 END) AS yoga,
       SUM(CASE WHEN ws.pick_type = 'lower' THEN 1 ELSE 0 END) AS lower_picks,
       SUM(CASE WHEN ${sqlIsYourPick('ws')} AND EXISTS (
         SELECT 1 FROM locked_weeks lw WHERE lw.user_id = ws.user_id AND lw.week_number = ws.week_number
       ) THEN 1 ELSE 0 END) AS picks_in_locked_weeks
     FROM workout_sessions ws
     WHERE ws.user_id = ? AND ws.is_completed = 1 AND ws.program_track = 'main'`,
    [userId]
  );
  const row = (result.rows[0] || {}) as Record<string, number | null>;
  return {
    picks: Number(row.picks || 0),
    pickTypes: Number(row.pick_types || 0),
    yoga: Number(row.yoga || 0),
    lower: Number(row.lower_picks || 0),
    lockedWithPick: Number(row.picks_in_locked_weeks || 0) > 0,
  };
}
