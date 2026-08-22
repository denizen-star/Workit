import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
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

    return NextResponse.json({
      allBadges: allBadges.rows,
      earnedBadges: earnedBadges.rows,
    });
  } catch (error) {
    console.error('Error getting badges:', error);
    return NextResponse.json({ error: 'Failed to get badges' }, { status: 500 });
  }
}
