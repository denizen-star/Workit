import { query } from '@/lib/db';

export type AwardedBadge = {
  id: number;
  name: string;
  description: string;
  icon: string | null;
  requirement_type: string;
  requirement_value: number;
};

export async function checkAndAwardBadges(userId: number): Promise<AwardedBadge[]> {
  const newlyAwarded: AwardedBadge[] = [];

  try {
    const statsResult = await query(
      `SELECT 
        COUNT(DISTINCT ws.id) as total_workouts,
        COUNT(DISTINCT CASE WHEN ws.is_completed THEN ws.id END) as completed_workouts,
        SUM(CASE WHEN es.weight_lbs IS NOT NULL AND es.actual_reps IS NOT NULL 
            THEN es.weight_lbs * es.actual_reps ELSE 0 END) as total_weight_lifted
       FROM workout_sessions ws
       LEFT JOIN exercise_sets es ON ws.id = es.workout_session_id
       WHERE ws.user_id = ?`,
      [userId]
    );

    const userStats = statsResult.rows[0] as {
      completed_workouts: number;
      total_weight_lifted: number;
    };

    const weeklyCompletion = await query(
      `SELECT week_number, COUNT(*) as completed_days
       FROM workout_sessions
       WHERE user_id = ? AND is_completed = true
       GROUP BY week_number
       HAVING completed_days >= 4`,
      [userId]
    );

    const completedWeeks = weeklyCompletion.rows.length;

    let consecutiveWeeks = 0;
    if (weeklyCompletion.rows.length > 0) {
      const weeks = (weeklyCompletion.rows as { week_number: number }[])
        .map((r) => r.week_number)
        .sort((a, b) => a - b);
      let streak = 1;
      for (let i = 1; i < weeks.length; i++) {
        if (weeks[i] === weeks[i - 1] + 1) {
          streak++;
        } else {
          break;
        }
      }
      consecutiveWeeks = streak;
    }

    const badgeConditions = [
      { type: 'first_workout', value: userStats.completed_workouts >= 1 },
      { type: 'week_complete', value: completedWeeks >= 1 },
      { type: 'streak', value: consecutiveWeeks, comparison: 'gte' },
      { type: 'weight_milestone', value: userStats.total_weight_lifted, comparison: 'gte' },
      { type: 'total_workouts', value: userStats.completed_workouts, comparison: 'gte' },
      { type: 'program_complete', value: completedWeeks >= 6 },
    ];

    for (const condition of badgeConditions) {
      const badges = await query('SELECT * FROM badges WHERE requirement_type = ?', [condition.type]);

      for (const badge of badges.rows as AwardedBadge[]) {
        let shouldAward = false;
        if (condition.comparison === 'gte') {
          shouldAward = (condition.value as number) >= badge.requirement_value;
        } else {
          shouldAward = !!condition.value;
        }

        if (shouldAward) {
          const awarded = await awardIfNew(userId, badge);
          if (awarded) newlyAwarded.push(badge);
        }
      }
    }

    const perfectWeeks = await query(
      `SELECT ws.week_number
       FROM workout_sessions ws
       WHERE ws.user_id = ? AND ws.is_completed = true
       GROUP BY ws.week_number
       HAVING COUNT(*) = 4 AND 
              SUM(CASE WHEN NOT EXISTS (
                SELECT 1 FROM exercise_sets es 
                WHERE es.workout_session_id = ws.id AND es.is_completed = false
              ) THEN 1 ELSE 0 END) = COUNT(*)`,
      [userId]
    );

    if (perfectWeeks.rows.length > 0) {
      const perfectBadge = await query('SELECT * FROM badges WHERE requirement_type = ?', [
        'perfect_week',
      ]);
      if (perfectBadge.rows.length > 0) {
        const badge = perfectBadge.rows[0] as AwardedBadge;
        const awarded = await awardIfNew(userId, badge);
        if (awarded) newlyAwarded.push(badge);
      }
    }
  } catch (error) {
    console.error('Error checking badges:', error);
  }

  return newlyAwarded;
}

async function awardIfNew(userId: number, badge: AwardedBadge): Promise<boolean> {
  const existing = await query('SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?', [
    userId,
    badge.id,
  ]);
  if (existing.rows.length > 0) return false;
  await query('INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)', [userId, badge.id]);
  return true;
}
