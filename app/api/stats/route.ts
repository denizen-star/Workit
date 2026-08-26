import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { sqlSetVolume } from '@/lib/exerciseKind';
import { sqlUserOptionalVolume } from '@/lib/optionals';
import { countCurrentStreak, householdHomeStats } from '@/lib/statsHousehold';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = user.id;
    const home = request.nextUrl.searchParams.get('home') === '1';
    const excludeSession = Math.trunc(Number(request.nextUrl.searchParams.get('excludeSession') || 0));
    const excludeThis = excludeSession > 0;
    const optionalExclude = excludeThis ? `AND optws.id != ${excludeSession}` : '';
    const optionalTotal = sqlUserOptionalVolume(String(Number(userId)), optionalExclude);

    const overallStatsResult = await query(
      `SELECT 
        COUNT(DISTINCT ws.id) as total_workouts,
        COUNT(DISTINCT CASE WHEN ws.is_completed THEN ws.id END) as completed_workouts,
        COUNT(DISTINCT es.exercise_name) as unique_exercises,
        COALESCE(SUM(${sqlSetVolume('es')}), 0) + ${optionalTotal} as total_weight_lifted
       FROM workout_sessions ws
       LEFT JOIN exercise_sets es ON ws.id = es.workout_session_id
       WHERE ws.user_id = ?${excludeThis ? ' AND ws.id != ?' : ''}`,
      excludeThis ? [userId, excludeSession] : [userId]
    );

    const weeklyStats = home
      ? { rows: [] as unknown[] }
      : await query(
          `SELECT 
        week_number,
        COUNT(*) as total_days,
        COUNT(CASE WHEN is_completed THEN 1 END) as completed_days
       FROM workout_sessions
       WHERE user_id = ?
       GROUP BY week_number
       ORDER BY week_number`,
          [userId]
        );

    const dailyStats = await query(
      `SELECT * FROM daily_stats 
       WHERE user_id = ? 
       ORDER BY workout_date DESC`,
      [userId]
    );

    const streakResult = await query(
      `SELECT workout_date FROM daily_stats 
       WHERE user_id = ? AND total_exercises_completed > 0
       ORDER BY workout_date DESC`,
      [userId]
    );

    const currentStreak = countCurrentStreak(
      streakResult.rows.map((row) => row.workout_date)
    );

    const durationStats = home
      ? { rows: [{}] }
      : await query(
          `SELECT
        AVG(TIMESTAMPDIFF(SECOND, started_at, ended_at)) as avg_seconds,
        MAX(TIMESTAMPDIFF(SECOND, started_at, ended_at)) as max_seconds,
        SUM(TIMESTAMPDIFF(SECOND, started_at, ended_at)) as total_seconds
       FROM workout_sessions
       WHERE user_id = ?
         AND is_completed = 1
         AND started_at IS NOT NULL
         AND ended_at IS NOT NULL`,
          [userId]
        );

    const recentDurations = home
      ? { rows: [] as unknown[] }
      : await query(
          `SELECT workout_type, week_number, day_number, started_at, ended_at,
              TIMESTAMPDIFF(SECOND, started_at, ended_at) as duration_seconds
       FROM workout_sessions
       WHERE user_id = ?
         AND is_completed = 1
         AND started_at IS NOT NULL
         AND ended_at IS NOT NULL
       ORDER BY ended_at DESC
       LIMIT 5`,
          [userId]
        );

    const household = await householdHomeStats(
      dailyStats.rows.map((row) => row.workout_date)
    );

    return NextResponse.json({
      overall: overallStatsResult.rows[0],
      weekly: weeklyStats.rows,
      daily: dailyStats.rows,
      currentStreak,
      timing: durationStats.rows[0],
      recentDurations: recentDurations.rows,
      household,
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}
