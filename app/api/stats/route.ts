import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = user.id;

    const overallStatsResult = await query(
      `SELECT 
        COUNT(DISTINCT ws.id) as total_workouts,
        COUNT(DISTINCT CASE WHEN ws.is_completed THEN ws.id END) as completed_workouts,
        COUNT(DISTINCT es.exercise_name) as unique_exercises,
        SUM(CASE WHEN es.weight_lbs IS NOT NULL AND es.actual_reps IS NOT NULL 
            THEN es.weight_lbs * es.actual_reps ELSE 0 END) as total_weight_lifted
       FROM workout_sessions ws
       LEFT JOIN exercise_sets es ON ws.id = es.workout_session_id
       WHERE ws.user_id = ?`,
      [userId]
    );

    const weeklyStats = await query(
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
       ORDER BY workout_date DESC 
       LIMIT 30`,
      [userId]
    );

    const streakResult = await query(
      `SELECT workout_date FROM daily_stats 
       WHERE user_id = ? AND total_exercises_completed > 0
       ORDER BY workout_date DESC`,
      [userId]
    );

    let currentStreak = 0;
    if (streakResult.rows.length > 0) {
      const dates = streakResult.rows.map((r: any) => new Date(r.workout_date));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < dates.length; i++) {
        const date = new Date(dates[i]);
        date.setHours(0, 0, 0, 0);
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        
        if (date.getTime() === expectedDate.getTime()) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    const durationStats = await query(
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

    const recentDurations = await query(
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

    return NextResponse.json({
      overall: overallStatsResult.rows[0],
      weekly: weeklyStats.rows,
      daily: dailyStats.rows,
      currentStreak,
      timing: durationStats.rows[0],
      recentDurations: recentDurations.rows
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}
