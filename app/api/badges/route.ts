import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { bonusTypeSql } from '@/lib/bonusDay';
import { checkAndAwardBadges } from '@/lib/badges';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = user.id;

    await checkAndAwardBadges(userId);

    const allBadges = await query('SELECT * FROM badges ORDER BY requirement_value');

    const earnedBadges = await query(
      `SELECT b.*, ub.earned_at 
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = ?
       ORDER BY ub.earned_at DESC`,
      [userId]
    );

    const bonus = await query(
      `SELECT COUNT(DISTINCT week_number) as bonus_weeks
       FROM workout_sessions
       WHERE user_id = ? AND is_completed = 1 AND ${bonusTypeSql('workout_sessions')}`,
      [userId]
    );

    const optionalWeeks = await query(
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
    );

    const optionalSlots = await query(
      `SELECT
         SUM(CASE WHEN warmup_completed_at IS NOT NULL THEN 1 ELSE 0 END)
           + SUM(CASE WHEN cooldown_completed_at IS NOT NULL THEN 1 ELSE 0 END) as optional_slots
       FROM workout_sessions
       WHERE user_id = ?`,
      [userId]
    );

    return NextResponse.json({
      allBadges: allBadges.rows,
      earnedBadges: earnedBadges.rows,
      bonusCount: Number((bonus.rows[0] as { bonus_weeks: number } | undefined)?.bonus_weeks || 0),
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
