import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { updateDailyStats } from '@/lib/dailyStats';
import { exerciseHistoryKey } from '@/lib/exerciseKey';
import { parseHardness } from '@/lib/hardness';
import { trackServerEvent } from '@/lib/trackServerEvent';

async function assertSessionOwnership(sessionId: number, userId: number) {
  const result = await query(
    'SELECT id FROM workout_sessions WHERE id = ? AND user_id = ?',
    [sessionId, userId]
  );
  return result.rows.length > 0;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

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
    const hardness = parseHardness(body.hardness);

    if (hardness != null) {
      let hardnessRow: { id: number; is_completed: unknown; hardness: unknown } | null = null;

      if (id) {
        const setCheck = await query(
          `SELECT es.id, es.is_completed, es.hardness
           FROM exercise_sets es
           JOIN workout_sessions ws ON ws.id = es.workout_session_id
           WHERE es.id = ? AND ws.user_id = ?`,
          [id, user.id]
        );
        hardnessRow = (setCheck.rows[0] as { id: number; is_completed: unknown; hardness: unknown } | undefined) || null;
      } else if (workoutSessionId && exerciseName && setNumber != null) {
        const ownedForHardness = await assertSessionOwnership(Number(workoutSessionId), user.id);
        if (!ownedForHardness) {
          return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }
        const existing = await query(
          `SELECT id, is_completed, hardness
           FROM exercise_sets
           WHERE workout_session_id = ? AND exercise_name = ? AND set_number = ?
           LIMIT 1`,
          [workoutSessionId, exerciseName, setNumber]
        );
        hardnessRow = (existing.rows[0] as { id: number; is_completed: unknown; hardness: unknown } | undefined) || null;
      }

      if (!hardnessRow) {
        return NextResponse.json({ error: 'Set not found' }, { status: 404 });
      }
      if (!Boolean(Number(hardnessRow.is_completed))) {
        return NextResponse.json({ error: 'Complete the set first' }, { status: 400 });
      }

      const already = parseHardness(hardnessRow.hardness);
      if (already != null) {
        return NextResponse.json({ success: true, hardness: already, locked: true }, { status: 409 });
      }

      await query('UPDATE exercise_sets SET hardness = ? WHERE id = ?', [hardness, hardnessRow.id]);
      return NextResponse.json({ success: true, setId: hardnessRow.id, hardness });
    }

    const owned = await assertSessionOwnership(Number(workoutSessionId), user.id);
    if (!owned) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    let setId = id ?? null;

    if (setId) {
      const setCheck = await query(
        `SELECT es.id FROM exercise_sets es
         JOIN workout_sessions ws ON ws.id = es.workout_session_id
         WHERE es.id = ? AND ws.user_id = ?`,
        [setId, user.id]
      );
      if (setCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Set not found' }, { status: 404 });
      }

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

    await updateDailyStats(workoutSessionId, user.id);

    if (isCompleted) {
      void trackServerEvent({
        eventType: 'set_logged',
        pageCategory: 'workout',
        articleSlug: typeof exerciseName === 'string' ? exerciseName : null,
      });
    }

    return NextResponse.json({ success: true, setId });
  } catch (error) {
    console.error('Error saving exercise set:', error);
    return NextResponse.json({ error: 'Failed to save exercise set' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const setId = Number(searchParams.get('id'));
    if (!Number.isFinite(setId) || setId <= 0) {
      return NextResponse.json({ error: 'Set ID required' }, { status: 400 });
    }

    const setCheck = await query(
      `SELECT es.id, es.is_completed, es.workout_session_id
       FROM exercise_sets es
       JOIN workout_sessions ws ON ws.id = es.workout_session_id
       WHERE es.id = ? AND ws.user_id = ?`,
      [setId, user.id]
    );

    if (setCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 });
    }

    const row = setCheck.rows[0] as { id: number; is_completed: unknown; workout_session_id: number };
    if (Boolean(Number(row.is_completed))) {
      return NextResponse.json({ error: 'Completed sets cannot be removed' }, { status: 400 });
    }

    await query('DELETE FROM exercise_sets WHERE id = ?', [setId]);
    await updateDailyStats(row.workout_session_id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exercise set:', error);
    return NextResponse.json({ error: 'Failed to delete exercise set' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const history = searchParams.get('history');
    const sessionId = searchParams.get('sessionId');

    if (history) {
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
        [user.id, currentSessionId]
      );

      const lastSessionByExercise: Record<string, number> = {};
      const lastSets: Record<string, Array<{ set_number: number; weight_lbs: number | null; actual_reps: number | null }>> = {};
      const personalRecords: Record<string, { weight: number; reps: number }> = {};
      const lastWeekMax: Record<string, number> = {};

      for (const row of result.rows as any[]) {
        const name = exerciseHistoryKey(row.exercise_name);
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
        const name = exerciseHistoryKey(row.exercise_name);
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

    const owned = await assertSessionOwnership(Number(sessionId), user.id);
    if (!owned) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
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
