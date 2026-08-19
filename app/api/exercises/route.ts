import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { workoutSessionId, exerciseName, setNumber, targetReps, actualReps, weightLbs, isCompleted, notes } = await request.json();

    const result = await query(
      `INSERT INTO exercise_sets (workout_session_id, exercise_name, set_number, target_reps, actual_reps, weight_lbs, is_completed, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE actual_reps = ?, weight_lbs = ?, is_completed = ?, notes = ?`,
      [workoutSessionId, exerciseName, setNumber, targetReps, actualReps, weightLbs, isCompleted, notes,
       actualReps, weightLbs, isCompleted, notes]
    );

    // Update daily stats
    await updateDailyStats(workoutSessionId);

    return NextResponse.json({ success: true, setId: result.insertId });
  } catch (error) {
    console.error('Error saving exercise set:', error);
    return NextResponse.json({ error: 'Failed to save exercise set' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const result = await query(
      'SELECT * FROM exercise_sets WHERE workout_session_id = ? ORDER BY exercise_name, set_number',
      [sessionId]
    );

    return NextResponse.json({ sets: result.rows });
  } catch (error) {
    console.error('Error getting exercise sets:', error);
    return NextResponse.json({ error: 'Failed to get exercise sets' }, { status: 500 });
  }
}

async function updateDailyStats(workoutSessionId: number) {
  try {
    // Get session info
    const sessionResult = await query(
      'SELECT user_id, DATE(COALESCE(completed_at, NOW())) as workout_date FROM workout_sessions WHERE id = ?',
      [workoutSessionId]
    );

    if (sessionResult.rows.length === 0) return;

    const { user_id, workout_date } = sessionResult.rows[0];

    // Calculate totals for the day
    const statsResult = await query(
      `SELECT 
        COUNT(DISTINCT exercise_name) as total_exercises,
        COUNT(*) as total_sets,
        SUM(CASE WHEN weight_lbs IS NOT NULL AND actual_reps IS NOT NULL 
            THEN weight_lbs * actual_reps ELSE 0 END) as total_weight
       FROM exercise_sets es
       JOIN workout_sessions ws ON es.workout_session_id = ws.id
       WHERE ws.user_id = ? AND DATE(COALESCE(ws.completed_at, NOW())) = ? AND es.is_completed = true`,
      [user_id, workout_date]
    );

    const stats = statsResult.rows[0];

    await query(
      `INSERT INTO daily_stats (user_id, workout_date, total_exercises_completed, total_sets_completed, total_weight_lifted)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         total_exercises_completed = VALUES(total_exercises_completed),
         total_sets_completed = VALUES(total_sets_completed),
         total_weight_lifted = VALUES(total_weight_lifted)`,
      [user_id, workout_date, stats.total_exercises, stats.total_sets, stats.total_weight || 0]
    );
  } catch (error) {
    console.error('Error updating daily stats:', error);
  }
}
