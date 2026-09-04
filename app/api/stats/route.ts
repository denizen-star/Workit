import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { sqlSetEffortVolume, sqlSetVolume } from '@/lib/exerciseKind';
import { sqlSessionOptionalVolume, sqlUserOptionalVolume } from '@/lib/optionals';
import { lockedWeekStreak } from '@/lib/bonusDay';
import { householdHomeStats } from '@/lib/statsHousehold';

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
        COALESCE(SUM(${sqlSetVolume('es')}), 0) + ${optionalTotal} as total_weight_lifted,
        COALESCE(SUM(${sqlSetEffortVolume('es')}), 0) + ${optionalTotal} as total_effort_lifted
       FROM workout_sessions ws
       LEFT JOIN exercise_sets es ON ws.id = es.workout_session_id AND es.is_completed = 1
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

    const weekCounts = await query(
      `SELECT week_number, COUNT(CASE WHEN is_completed THEN 1 END) as completed_days
       FROM workout_sessions
       WHERE user_id = ?
       GROUP BY week_number`,
      [userId]
    );
    const currentStreak = lockedWeekStreak(
      new Map(
        (weekCounts.rows as { week_number: number; completed_days: number }[]).map((row) => [
          Number(row.week_number),
          Number(row.completed_days || 0),
        ])
      )
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

    let daily = dailyStats.rows as { workout_date: string; total_weight_lifted: number | string }[];
    try {
      const [effortDays, optionalDays] = await Promise.all([
        query(
          `SELECT DATE(COALESCE(ws.completed_at, ws.created_at)) as workout_date,
                  COALESCE(SUM(${sqlSetEffortVolume('es')}), 0) as weight
           FROM exercise_sets es
           INNER JOIN workout_sessions ws ON ws.id = es.workout_session_id
           WHERE ws.user_id = ?
             AND ws.is_completed = 1
             AND es.is_completed = 1
           GROUP BY DATE(COALESCE(ws.completed_at, ws.created_at))`,
          [userId]
        ),
        query(
          `SELECT DATE(COALESCE(ws.completed_at, ws.created_at)) as workout_date,
                  COALESCE(SUM(${sqlSessionOptionalVolume('ws')}), 0) as weight
           FROM workout_sessions ws
           WHERE ws.user_id = ?
             AND ws.is_completed = 1
           GROUP BY DATE(COALESCE(ws.completed_at, ws.created_at))`,
          [userId]
        ),
      ]);
      const byDate = new Map<string, number>();
      for (const row of [
        ...(effortDays.rows as { workout_date: unknown; weight: number }[]),
        ...(optionalDays.rows as { workout_date: unknown; weight: number }[]),
      ]) {
        const key = String(row.workout_date || '').slice(0, 10);
        if (!key) continue;
        byDate.set(key, (byDate.get(key) || 0) + Number(row.weight || 0));
      }
      if (byDate.size > 0) {
        daily = [...byDate.entries()]
          .map(([workout_date, total_weight_lifted]) => ({ workout_date, total_weight_lifted }))
          .sort((a, b) => b.workout_date.localeCompare(a.workout_date));
      }
    } catch {
      daily = dailyStats.rows as { workout_date: string; total_weight_lifted: number | string }[];
    }

    let dailyHardness: { workout_date: string; avg_hard: number }[] = [];
    try {
      const hardness = await query(
        `SELECT DATE(COALESCE(ws.completed_at, ws.created_at)) as workout_date,
                AVG(es.hardness) as avg_hard
         FROM exercise_sets es
         INNER JOIN workout_sessions ws ON ws.id = es.workout_session_id
         WHERE ws.user_id = ?
           AND ws.is_completed = 1
           AND es.is_completed = 1
           AND es.hardness IS NOT NULL
         GROUP BY DATE(COALESCE(ws.completed_at, ws.created_at))
         ORDER BY workout_date DESC`,
        [userId]
      );
      dailyHardness = hardness.rows as { workout_date: string; avg_hard: number }[];
    } catch {
      dailyHardness = [];
    }

    return NextResponse.json({
      overall: overallStatsResult.rows[0],
      weekly: weeklyStats.rows,
      daily,
      dailyHardness,
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
