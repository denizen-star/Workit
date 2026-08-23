import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { bonusCount, sessionIsBonus } from '@/lib/bonusDay';
import { checkAndAwardBadges } from '@/lib/badges';
import { queueWorkoutCompleteEmails } from '@/lib/emails/lifecycle';
import { trackServerEvent } from '@/lib/trackServerEvent';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { weekNumber, dayNumber, workoutType, scheduledDate, workoutMode } = await request.json();
    const mode = String(workoutMode || '').trim().toLowerCase() === 'travel' ? 'travel' : 'gym';

    const result = await query(
      `INSERT INTO workout_sessions (user_id, week_number, day_number, workout_type, workout_mode, scheduled_date, started_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [user.id, weekNumber, dayNumber, workoutType, mode, scheduledDate]
    );

    return NextResponse.json({ 
      success: true, 
      sessionId: result.insertId 
    });
  } catch (error) {
    console.error('Error creating workout session:', error);
    return NextResponse.json({ error: 'Failed to create workout session' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekNumber = searchParams.get('weekNumber');
    const sessionId = searchParams.get('sessionId');
    const history = searchParams.get('history') === '1';

    if (history) {
      const sessionResult = await query(
        `SELECT id, week_number, day_number, workout_type, workout_mode,
                started_at, completed_at, ended_at, created_at
         FROM workout_sessions
         WHERE user_id = ? AND is_completed = 1
         ORDER BY week_number, day_number, COALESCE(completed_at, created_at) DESC`,
        [user.id]
      );

      const sessions = sessionResult.rows as {
        id: number;
        week_number: number;
        day_number: number;
        workout_type: string;
        workout_mode: string | null;
        started_at: string | null;
        completed_at: string | null;
        ended_at: string | null;
        created_at: string | null;
      }[];

      if (sessions.length === 0) {
        return NextResponse.json({ sessions: [] });
      }

      const ids = sessions.map((row) => row.id);
      const placeholders = ids.map(() => '?').join(', ');
      const setResult = await query(
        `SELECT workout_session_id, exercise_name, set_number, target_reps, actual_reps, weight_lbs
         FROM exercise_sets
         WHERE workout_session_id IN (${placeholders}) AND is_completed = 1
         ORDER BY workout_session_id, id, set_number`,
        ids
      );

      const setsBySession = new Map<number, typeof setResult.rows>();
      for (const row of setResult.rows as {
        workout_session_id: number;
        exercise_name: string;
        set_number: number;
        target_reps: string | null;
        actual_reps: number | null;
        weight_lbs: number | null;
      }[]) {
        const list = setsBySession.get(Number(row.workout_session_id)) || [];
        list.push(row);
        setsBySession.set(Number(row.workout_session_id), list);
      }

      return NextResponse.json({
        sessions: sessions.map((session) => ({
          ...session,
          sets: setsBySession.get(Number(session.id)) || [],
        })),
      });
    }

    if (sessionId) {
      const sessionResult = await query(
        'SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?',
        [sessionId, user.id]
      );

      if (sessionResult.rows.length === 0) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const exercises = await query(
        'SELECT * FROM exercise_sets WHERE workout_session_id = ? ORDER BY exercise_name, set_number',
        [sessionId]
      );

      return NextResponse.json({ session: sessionResult.rows[0], exercises: exercises.rows });
    }

    let sql = 'SELECT * FROM workout_sessions WHERE user_id = ?';
    const params: any[] = [user.id];

    if (weekNumber) {
      sql += ' AND week_number = ?';
      params.push(weekNumber);
    }

    sql += ' ORDER BY week_number, day_number';

    const result = await query(sql, params);
    return NextResponse.json({ sessions: result.rows });
  } catch (error) {
    console.error('Error getting workout sessions:', error);
    return NextResponse.json({ error: 'Failed to get workout sessions' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { sessionId, isCompleted, notes } = await request.json();

    const existing = await query(
      'SELECT id, week_number, day_number, workout_type, is_completed FROM workout_sessions WHERE id = ? AND user_id = ?',
      [sessionId, user.id]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = existing.rows[0] as {
      id: number;
      week_number: number;
      day_number: number;
      workout_type: string;
      is_completed: number | boolean;
    };
    const alreadyComplete = Boolean(Number(session.is_completed));
    const bonus = sessionIsBonus(session);

    await query(
      `UPDATE workout_sessions 
       SET is_completed = ?, completed_at = ?, ended_at = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [isCompleted, isCompleted ? new Date() : null, isCompleted ? new Date() : null, notes, sessionId, user.id]
    );

    const awardedBadges = isCompleted && !alreadyComplete
      ? await checkAndAwardBadges(user.id)
      : [];

    if (isCompleted && !alreadyComplete) {
      void trackServerEvent({
        eventType: 'workout_complete',
        pageCategory: 'workout',
      });
      for (const badge of awardedBadges) {
        void trackServerEvent({
          eventType: 'badge_awarded',
          pageCategory: 'workout',
          articleSlug: badge.requirement_type,
          articleContext: badge.name,
        });
      }
      queueWorkoutCompleteEmails({
        userId: user.id,
        name: user.name,
        email: user.email,
        sessionId: Number(sessionId),
        weekNumber: Number(session.week_number),
        dayName: session.workout_type,
        awarded: awardedBadges,
      });
    }

    let uniqueBonusWeeks = 0;
    if (isCompleted) {
      const all = await query(
        'SELECT week_number, day_number, workout_type, is_completed FROM workout_sessions WHERE user_id = ?',
        [user.id]
      );
      uniqueBonusWeeks = bonusCount(
        all.rows as Array<{
          week_number: number;
          day_number: number;
          workout_type: string;
          is_completed: number | boolean;
        }>
      );
    }

    return NextResponse.json({
      success: true,
      awardedBadges,
      bonus,
      bonusCount: uniqueBonusWeeks,
    });
  } catch (error) {
    console.error('Error updating workout session:', error);
    return NextResponse.json({ error: 'Failed to update workout session' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const weekNumber = searchParams.get('weekNumber');
    const dayNumber = searchParams.get('dayNumber');
    const resetDay = searchParams.get('resetDay') === '1';

    if (resetDay && weekNumber && dayNumber) {
      const open = await query(
        `SELECT id FROM workout_sessions
         WHERE user_id = ?
           AND week_number = ?
           AND day_number = ?
           AND (is_completed = 0 OR is_completed IS NULL OR is_completed = FALSE)`,
        [user.id, weekNumber, dayNumber]
      );

      for (const row of open.rows as { id: number }[]) {
        await query('DELETE FROM exercise_sets WHERE workout_session_id = ?', [row.id]);
        await query('DELETE FROM workout_sessions WHERE id = ? AND user_id = ?', [row.id, user.id]);
      }

      if (sessionId) {
        const owned = await query(
          'SELECT id FROM workout_sessions WHERE id = ? AND user_id = ?',
          [sessionId, user.id]
        );
        if (owned.rows.length > 0) {
          await query('DELETE FROM exercise_sets WHERE workout_session_id = ?', [sessionId]);
          await query('DELETE FROM workout_sessions WHERE id = ? AND user_id = ?', [sessionId, user.id]);
        }
      }

      return NextResponse.json({ success: true, deleted: open.rows.length });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const owned = await query(
      'SELECT id FROM workout_sessions WHERE id = ? AND user_id = ?',
      [sessionId, user.id]
    );

    if (owned.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    await query('DELETE FROM exercise_sets WHERE workout_session_id = ?', [sessionId]);
    await query('DELETE FROM workout_sessions WHERE id = ? AND user_id = ?', [sessionId, user.id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workout session:', error);
    return NextResponse.json({ error: 'Failed to delete workout session' }, { status: 500 });
  }
}
