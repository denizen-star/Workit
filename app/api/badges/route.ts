import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { bonusWeeksForUser } from '@/lib/yourPickBonus';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = user.id;

    // Read only: badges are awarded when a session finishes (Finish PUT / mark-complete,
    // lib/badges.ts `checkAndAwardBadges`), never on a Medals visit. All five reads are
    // independent.
    const [allBadges, earnedBadges, bonusWeeks, optionalWeeks, optionalSlots] = await Promise.all([
      query('SELECT * FROM badges ORDER BY requirement_value'),
      query(
        `SELECT b.*, ub.earned_at 
         FROM user_badges ub
         JOIN badges b ON ub.badge_id = b.id
         WHERE ub.user_id = ?
         ORDER BY ub.earned_at DESC`,
        [userId]
      ),
      // Past bonus weeks + weeks a Your pick went beyond the required count.
      bonusWeeksForUser(userId),
      query(
        `SELECT COUNT(*) as optional_weeks
         FROM (
           SELECT week_number
           FROM workout_sessions
           WHERE user_id = ?
           GROUP BY week_number
           HAVING SUM(CASE WHEN warmup_completed_at IS NOT NULL THEN 1 ELSE 0 END) >= 4
              AND SUM(CASE WHEN cooldown_completed_at IS NOT NULL THEN 1 ELSE 0 END) >= 4
         ) weeks`,
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
    ]);

    return NextResponse.json({
      allBadges: allBadges.rows,
      earnedBadges: earnedBadges.rows,
      bonusCount: bonusWeeks,
      optionalWeekCount: Number(
        (optionalWeeks.rows[0] as { optional_weeks: number } | undefined)?.optional_weeks || 0
      ),
      optionalCount: Number(
        (optionalSlots.rows[0] as { optional_slots: number } | undefined)?.optional_slots || 0
      ),
    });
  } catch (error) {
    console.error('Error getting badges:', error);
    return NextResponse.json({ error: 'Failed to get badges' }, { status: 500 });
  }
}
