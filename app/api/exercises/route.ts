import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id;
    const workoutSessionId = body.workoutSessionId ?? body.workout_session_id;
    const exerciseName = body.exerciseName ?? body.exercise_name;
    const setNumber = body.setNumber ?? body.set_number;
    const targetReps = body.targetReps ?? body.target_reps;
    const actualReps = body.actualReps ?? body.actual_reps;
    const weightLbs = body.weightLbs ?? body.weight_lbs;
    const isCompleted = body.isCompleted ?? body.is_completed ?? false;
    const notes = body.notes ?? null;

    let setId = id ?? null;

    if (setId) {
      await query(
        `UPDATE exercise_sets
         SET actual_reps = ?, weight_lbs = ?, is_completed = ?, notes = ?, target_reps = ?
         WHERE id = ?`,
        [actualReps, weightLbs, isCompleted, notes, targetReps, setId]
      );
    } else {
      const existing = await query(
        `SELECT id FROM exercise_sets
         WHERE workout_session_id = ? AND exercise_name = ? AND set_number = ?
         LIMIT 1`,
        [workoutSessionId, exerciseName, setNumber]
      );

      if (existing.rows[0]) {
        setId = existing.rows[0].id;
        await query(
          `UPDATE exercise_sets
           SET actual_reps = ?, weight_lbs = ?, is_completed = ?, notes = ?, target_reps = ?
           WHERE id = ?`,
          [actualReps, weightLbs, isCompleted, notes, targetReps, setId]
        );
      } else {
        const result = await query(
          `INSERT INTO exercise_sets (workout_session_id, exercise_name, set_number, target_reps, actual_reps, weight_lbs, is_completed, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [workoutSessionId, exerciseName, setNumber, targetReps, actualReps, weightLbs, isCompleted, notes]
        );
        setId = result.insertId;
      }
    }

    await updateDailyStats(workoutSessionId);

    return NextResponse.json({ success: true, setId });
  } catch (error) {
    console.error('Error saving exercise set:', error);
    return NextResponse.json({ error: 'Failed to save exercise set' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const history = searchParams.get('history');
    const sessionId = searchParams.get('sessionId');

    if (history) {
      const userId = searchParams.get('userId') || '1';
      const weekNumber = Number(searchParams.get('weekNumber') || '0');
      const currentSessionId = Number(sessionId || '0');
      const previousWeek = weekNumber > 1 ? weekNumber - 1 : 0;

      const result = await query(
        `SELECT es.exercise_name, es.set_number, es.weight_lbs, es.actual_reps,
                ws.week_number, ws.id as session_id,
                COALESCE(ws.completed_at, ws.created_at) as done_at
         FROM exercise_sets es
         JOIN workout_sessions ws ON ws.id = es.workout_session_id
         WHERE ws.user_id = ? AND es.is_completed = 1 AND ws.id != ?
         ORDER BY done_at DESC, es.set_number ASC`,
        [userId, currentSessionId]
      );

      const lastSessionByExercise: Record<string, number> = {};
      const lastSets: Record<string, Array<{ set_number: number; weight_lbs: number | null; actual_reps: number | null }>> = {};
      const personalRecords: Record<string, { weight: number; reps: number }> = {};
      const lastWeekMax: Record<string, number> = {};

      for (const row of result.rows as any[]) {
        const name = row.exercise_name;
        if (!lastSessionByExercise[name]) {
          lastSessionByExercise[name] = row.session_id;
        }

        const weight = row.weight_lbs == null ? 0 : Number(row.weight_lbs);
        const reps = row.actual_reps == null ? 0 : Number(row.actual_reps);

        if (!personalRecords[name]) {
          personalRecords[name] = { weight: 0, reps: 0 };
        }
        personalRecords[name].weight = Math.max(personalRecords[name].weight, weight);
        personalRecords[name].reps = Math.max(personalRecords[name].reps, reps);

        if (previousWeek && Number(row.week_number) === previousWeek) {
          lastWeekMax[name] = Math.max(lastWeekMax[name] || 0, weight);
        }
      }

      for (const row of result.rows as any[]) {
        const name = row.exercise_name;
        if (row.session_id !== lastSessionByExercise[name]) continue;
        if (!lastSets[name]) lastSets[name] = [];
        lastSets[name].push({
          set_number: Number(row.set_number),
          weight_lbs: row.weight_lbs == null ? null : Number(row.weight_lbs),
          actual_reps: row.actual_reps == null ? null : Number(row.actual_reps),
        });
      }

      return NextResponse.json({ lastSets, lastWeekMax, personalRecords });
    }

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
    const sessionResult = await query(
      'SELECT user_id, DATE(COALESCE(completed_at, NOW())) as workout_date FROM workout_sessions WHERE id = ?',
      [workoutSessionId]
    );

    if (sessionResult.rows.length === 0) return;

    const { user_id, workout_date } = sessionResult.rows[0];

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
