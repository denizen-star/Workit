import { easternHour } from '@/lib/analyticsTime';
import { query } from '@/lib/db';
import { sqlSetVolume } from '@/lib/exerciseKind';
import { sqlSessionOptionalVolume, sqlUserOptionalVolume } from '@/lib/optionals';
import { clampScheduleDays, requiredCountForWeek } from '@/lib/scheduleDays';
import { lockedWeekNumbers } from '@/lib/lockedWeeks';
import { bonusWeeksForUser, yourPickBadgeStats } from '@/lib/yourPickBonus';
import { sqlSessionCountsForWeek, sqlSetCounts } from '@/lib/skippedSets';

export type AwardedBadge = {
  id: number;
  name: string;
  description: string;
  icon: string | null;
  requirement_type: string;
  requirement_value: number;
};

function hourInNewYork(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : easternHour(date);
}

export async function checkAndAwardBadges(userId: number): Promise<AwardedBadge[]> {
  try {
    // Every read is independent, so one parallel batch instead of ~65 round trips.
    const [
      statsResult,
      userRow,
      weeks,
      extraStats,
      bonusWeeks,
      picks,
      optionalWeeksRaw,
      optionalSlots,
      sessionAgg,
      perfectWeeksRaw,
      allBadges,
      earned,
    ] = await Promise.all([
      query(
        `SELECT 
          COUNT(DISTINCT ws.id) as total_workouts,
          COUNT(DISTINCT CASE WHEN ws.is_completed THEN ws.id END) as completed_workouts,
          SUM(${sqlSetVolume('es')}) + ${sqlUserOptionalVolume('ws.user_id')} as total_weight_lifted
         FROM workout_sessions ws
         LEFT JOIN exercise_sets es ON ws.id = es.workout_session_id AND ${sqlSetCounts('es')}
         WHERE ws.user_id = ?`,
        [userId]
      ),
      query('SELECT schedule_days_per_week FROM users WHERE id = ?', [userId]),
      // Weekly-completion/streak/program-complete read the persisted `locked_weeks`
      // table (lib/lockedWeeks.ts) — a week that already locked stays counted even if
      // the athlete later changes their day count.
      lockedWeekNumbers(userId),
      query(
        `SELECT
           SUM(CASE WHEN is_completed = 1 AND workout_mode = 'travel' THEN 1 ELSE 0 END) as travel_days,
           SUM(CASE WHEN is_completed = 1 AND workout_type LIKE '%Upper%' THEN 1 ELSE 0 END) as upper_days,
           SUM(CASE WHEN is_completed = 1 AND workout_type LIKE '%Lower%' THEN 1 ELSE 0 END) as lower_days
         FROM workout_sessions
         WHERE user_id = ?`,
        [userId]
      ),
      // Bonus Day: past bonus weeks + weeks a Your pick went past the required count.
      bonusWeeksForUser(userId),
      yourPickBadgeStats(userId),
      query(
        `SELECT
           week_number,
           SUM(CASE WHEN warmup_completed_at IS NOT NULL THEN 1 ELSE 0 END) as warmup_n,
           SUM(CASE WHEN cooldown_completed_at IS NOT NULL THEN 1 ELSE 0 END) as cooldown_n
         FROM workout_sessions
         WHERE user_id = ?
         GROUP BY week_number`,
        [userId]
      ),
      query(
        `SELECT
           SUM(CASE WHEN warmup_completed_at IS NOT NULL THEN 1 ELSE 0 END)
             + SUM(CASE WHEN cooldown_completed_at IS NOT NULL THEN 1 ELSE 0 END) as optional_slots
         FROM workout_sessions
         WHERE user_id = ?`,
        [userId]
      ),
      query(
        `SELECT
           ws.started_at,
           TIMESTAMPDIFF(SECOND, ws.started_at, ws.ended_at) as duration_seconds,
           COALESCE(SUM(${sqlSetVolume('es')}), 0) + ${sqlSessionOptionalVolume('ws')} as volume
         FROM workout_sessions ws
         LEFT JOIN exercise_sets es ON es.workout_session_id = ws.id AND ${sqlSetCounts('es')}
         WHERE ws.user_id = ? AND ws.is_completed = 1
         GROUP BY ws.id, ws.started_at, ws.ended_at`,
        [userId]
      ),
      query(
        `SELECT ws.week_number, COUNT(*) as completed_days,
                SUM(CASE WHEN NOT EXISTS (
                  SELECT 1 FROM exercise_sets es
                  WHERE es.workout_session_id = ws.id AND es.is_completed = false
                ) THEN 1 ELSE 0 END) as full_days
         FROM workout_sessions ws
         WHERE ws.user_id = ? AND ws.is_completed = true AND ${sqlSessionCountsForWeek('ws')}
         GROUP BY ws.week_number`,
        [userId]
      ),
      query('SELECT * FROM badges ORDER BY id'),
      query('SELECT badge_id FROM user_badges WHERE user_id = ?', [userId]),
    ]);

    const userStats = statsResult.rows[0] as {
      completed_workouts: number;
      total_weight_lifted: number;
    };

    // This athlete's own chosen day count — see lib/scheduleDays.ts. A flat SQL
    // HAVING can't vary per week (weeks 1-2 have no bonus day, so a 5-day athlete's
    // required count is naturally 4 there), so completion is filtered in JS for the
    // per-week checks (optionalWeeks, travel_week, perfectWeeks) that don't have a
    // persisted equivalent.
    const scheduleDays = clampScheduleDays(
      (userRow.rows[0] as { schedule_days_per_week?: number | null } | undefined)?.schedule_days_per_week
    );
    const requiredForWeek = requiredCountForWeek(scheduleDays);

    const completedWeeks = weeks.length;
    // Longest back-to-back run anywhere in the locked weeks (ascending). Counting only from
    // the first locked week meant one gap froze the streak, so later runs never earned the
    // 4/5/6-week badges. Badges are permanent, so the best run is what matters.
    let consecutiveWeeks = 0;
    let run = 0;
    for (let i = 0; i < weeks.length; i++) {
      run = i > 0 && weeks[i] === weeks[i - 1] + 1 ? run + 1 : 1;
      consecutiveWeeks = Math.max(consecutiveWeeks, run);
    }

    const extra = extraStats.rows[0] as {
      travel_days: number;
      upper_days: number;
      lower_days: number;
    };

    // Same fairness reasoning as weeklyCompletion above: a 2-3 day athlete never
    // trains 4 sessions in a week, so the warmup/cooldown week-complete bar has to
    // scale with their own required count instead of a flat 4.
    const optionalWeeksCount = (
      optionalWeeksRaw.rows as { week_number: number; warmup_n: number; cooldown_n: number }[]
    ).filter((row) => {
      const required = requiredForWeek(Number(row.week_number));
      return Number(row.warmup_n) >= required && Number(row.cooldown_n) >= required;
    }).length;
    const optionalSlotCount = Number(
      (optionalSlots.rows[0] as { optional_slots: number } | undefined)?.optional_slots || 0
    );

    let maxSessionVolume = 0;
    let hasFast = false;
    let hasLong = false;
    let hasEarly = false;
    let hasNight = false;
    for (const row of sessionAgg.rows as {
      started_at: string | Date | null;
      duration_seconds: number | null;
      volume: number;
    }[]) {
      maxSessionVolume = Math.max(maxSessionVolume, Number(row.volume || 0));
      const duration = Number(row.duration_seconds || 0);
      if (duration > 0 && duration < 45 * 60) hasFast = true;
      if (duration > 90 * 60) hasLong = true;
      const hour = hourInNewYork(row.started_at);
      if (hour != null && hour < 8) hasEarly = true;
      if (hour != null && hour >= 20) hasNight = true;
    }

    const hasPerfectWeek = (
      perfectWeeksRaw.rows as { week_number: number; completed_days: number; full_days: number }[]
    ).some(
      (row) =>
        Number(row.completed_days) >= requiredForWeek(Number(row.week_number)) &&
        Number(row.full_days) === Number(row.completed_days)
    );

    const badgeConditions: { type: string; value: number | boolean; comparison?: 'gte' }[] = [
      { type: 'first_workout', value: userStats.completed_workouts >= 1 },
      { type: 'week_complete', value: completedWeeks >= 1 },
      { type: 'streak', value: consecutiveWeeks, comparison: 'gte' },
      { type: 'weight_milestone', value: userStats.total_weight_lifted, comparison: 'gte' },
      { type: 'total_workouts', value: userStats.completed_workouts, comparison: 'gte' },
      { type: 'program_complete', value: completedWeeks >= 6 },
      // Not week-scoped (a running lifetime count of travel-mode days), so it uses
      // the athlete's own count directly rather than a per-week lookup.
      { type: 'travel_week', value: Number(extra?.travel_days || 0) >= Math.min(scheduleDays, 4) },
      { type: 'upper_sessions', value: Number(extra?.upper_days || 0), comparison: 'gte' },
      { type: 'lower_sessions', value: Number(extra?.lower_days || 0), comparison: 'gte' },
      { type: 'session_volume', value: maxSessionVolume, comparison: 'gte' },
      { type: 'fast_session', value: hasFast },
      { type: 'long_session', value: hasLong },
      { type: 'early_bird', value: hasEarly },
      { type: 'night_owl', value: hasNight },
      { type: 'bonus_sessions', value: bonusWeeks, comparison: 'gte' },
      // Your pick badges (database/migrate-your-pick.sql).
      { type: 'pick_sessions', value: picks.picks, comparison: 'gte' },
      { type: 'pick_all_types', value: picks.pickTypes, comparison: 'gte' },
      { type: 'pick_yoga', value: picks.yoga, comparison: 'gte' },
      { type: 'pick_lower', value: picks.lower, comparison: 'gte' },
      { type: 'pick_run', value: picks.run, comparison: 'gte' },
      { type: 'pick_locked_week', value: picks.lockedWithPick },
      { type: 'optional_weeks', value: optionalWeeksCount, comparison: 'gte' },
      { type: 'optionals', value: optionalSlotCount, comparison: 'gte' },
    ];

    const badges = allBadges.rows as AwardedBadge[];
    const earnedIds = new Set((earned.rows as { badge_id: number }[]).map((row) => Number(row.badge_id)));
    const newlyAwarded: AwardedBadge[] = [];
    const award = (badge: AwardedBadge) => {
      if (earnedIds.has(Number(badge.id))) return;
      earnedIds.add(Number(badge.id));
      newlyAwarded.push(badge);
    };

    for (const condition of badgeConditions) {
      for (const badge of badges) {
        if (badge.requirement_type !== condition.type) continue;
        const shouldAward =
          condition.comparison === 'gte'
            ? (condition.value as number) >= badge.requirement_value
            : !!condition.value;
        if (shouldAward) award(badge);
      }
    }

    if (hasPerfectWeek) {
      const perfectBadge = badges.find((badge) => badge.requirement_type === 'perfect_week');
      if (perfectBadge) award(perfectBadge);
    }

    if (newlyAwarded.length > 0) {
      await query(
        `INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES ${newlyAwarded.map(() => '(?, ?)').join(', ')}`,
        newlyAwarded.flatMap((badge) => [userId, badge.id])
      );
    }
    return newlyAwarded;
  } catch (error) {
    console.error('Error checking badges:', error);
    return [];
  }
}
