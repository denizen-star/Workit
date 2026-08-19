import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId, weekNumber, dayNumber, workoutType, scheduledDate } = await request.json();

    const result = await query(
      `INSERT INTO workout_sessions (user_id, week_number, day_number, workout_type, scheduled_date, started_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, weekNumber, dayNumber, workoutType, scheduledDate]
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '1';
    const weekNumber = searchParams.get('weekNumber');
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Get specific session with exercises
      const sessionResult = await query(
        'SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?',
        [sessionId, userId]
      );

      const exercises = await query(
        'SELECT * FROM exercise_sets WHERE workout_session_id = ? ORDER BY exercise_name, set_number',
        [sessionId]
      );

      return NextResponse.json({ session: sessionResult.rows[0], exercises: exercises.rows });
    }

    // Get all sessions for user, optionally filtered by week
    let sql = 'SELECT * FROM workout_sessions WHERE user_id = ?';
    const params: any[] = [userId];

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
    const { sessionId, isCompleted, notes } = await request.json();

    await query(
      `UPDATE workout_sessions 
       SET is_completed = ?, completed_at = ?, ended_at = ?, notes = ?
       WHERE id = ?`,
      [isCompleted, isCompleted ? new Date() : null, isCompleted ? new Date() : null, notes, sessionId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating workout session:', error);
    return NextResponse.json({ error: 'Failed to update workout session' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    await query('DELETE FROM workout_sessions WHERE id = ?', [sessionId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workout session:', error);
    return NextResponse.json({ error: 'Failed to delete workout session' }, { status: 500 });
  }
}
