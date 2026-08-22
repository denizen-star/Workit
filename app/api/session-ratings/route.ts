import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { AuthError, requireCurrentUser } from '@/lib/auth';
import { isRatingOutcome, parseStars } from '@/lib/feedback';
import { normalizeWorkoutMode } from '@/lib/workoutMode';

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const sessionId = Number(body.sessionId);
    const stars = parseStars(body.stars);
    const outcome = isRatingOutcome(body.outcome) ? body.outcome : null;

    if (!Number.isInteger(sessionId) || sessionId < 1 || stars == null || !outcome) {
      return NextResponse.json({ error: 'Session, stars, and outcome are required' }, { status: 400 });
    }

    const existing = await query(
      `SELECT id, week_number, day_number, workout_type, workout_mode
       FROM workout_sessions WHERE id = ? AND user_id = ?`,
      [sessionId, user.id]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = existing.rows[0] as {
      week_number: number;
      day_number: number;
      workout_type: string;
      workout_mode: string | null;
    };

    await query(
      `INSERT INTO session_ratings
         (user_id, session_id, stars, outcome, week_number, day_number, workout_type, workout_mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         stars = VALUES(stars),
         outcome = VALUES(outcome),
         week_number = VALUES(week_number),
         day_number = VALUES(day_number),
         workout_type = VALUES(workout_type),
         workout_mode = VALUES(workout_mode)`,
      [
        user.id,
        sessionId,
        stars,
        outcome,
        Number(session.week_number),
        Number(session.day_number),
        session.workout_type,
        normalizeWorkoutMode(session.workout_mode),
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error saving session rating', error);
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
  }
}
