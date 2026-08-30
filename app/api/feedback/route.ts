import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { AuthError, requireCurrentUser } from '@/lib/auth';
import { isFeedbackTopic, isThumbReason } from '@/lib/feedback';
import { sendNow } from '@/lib/emails/send';
import { buildFeedbackNoteEmail, feedbackMailTo } from '@/lib/emails/feedback';

function isDuplicateKeyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /duplicate/i.test(message);
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const sessionId = Number(request.nextUrl.searchParams.get('sessionId'));
    if (!Number.isInteger(sessionId) || sessionId < 1) {
      return NextResponse.json({ error: 'Session is required' }, { status: 400 });
    }

    const result = await query(
      `SELECT exercise_name, reason, message
       FROM feedback
       WHERE user_id = ? AND session_id = ? AND kind = 'thumb'`,
      [user.id, sessionId]
    );

    return NextResponse.json({
      thumbs: (
        result.rows as Array<{ exercise_name: string; reason: string | null; message: string | null }>
      ).map((row) => ({
        exerciseName: row.exercise_name,
        reason: row.reason,
        message: row.message || '',
      })),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error loading feedback', error);
    return NextResponse.json({ error: 'Failed to load feedback' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const kind = body.kind === 'thumb' ? 'thumb' : body.kind === 'note' ? 'note' : null;
    if (!kind) {
      return NextResponse.json({ error: 'Kind is required' }, { status: 400 });
    }

    if (kind === 'note') {
      const message = String(body.message || '').trim();
      const topic = isFeedbackTopic(body.topic) ? body.topic : null;
      const pageUrl = String(body.pageUrl || '').trim() || null;
      if (message.length < 3 || message.length > 4000) {
        return NextResponse.json({ error: 'Write me a real note, man.' }, { status: 400 });
      }

      const insert = await query(
        `INSERT INTO feedback (user_id, kind, topic, reason, message, exercise_name, session_id, page_url)
         VALUES (?, 'note', ?, NULL, ?, NULL, NULL, ?)`,
        [user.id, topic, message, pageUrl]
      );

      const to = feedbackMailTo();
      const mailId = await sendNow(
        to,
        buildFeedbackNoteEmail({
          name: user.name,
          email: user.email,
          topic,
          message,
          pageUrl,
        }),
        { userId: user.id, athleteName: user.name, template: 'feedback' }
      );
      if (mailId && insert.insertId) {
        await query('UPDATE feedback SET mailed_at = CURRENT_TIMESTAMP WHERE id = ?', [insert.insertId]).catch(
          () => null
        );
      }

      return NextResponse.json({ success: true, id: insert.insertId });
    }

    const sessionId = Number(body.sessionId);
    const exerciseName = String(body.exerciseName || '').trim();
    const vote = body.vote === 'up' ? 'up' : body.vote === 'down' ? 'down' : null;
    if (!Number.isInteger(sessionId) || sessionId < 1 || !exerciseName || !vote) {
      return NextResponse.json({ error: 'Session, exercise, and vote are required' }, { status: 400 });
    }

    const owned = await query('SELECT id FROM workout_sessions WHERE id = ? AND user_id = ?', [
      sessionId,
      user.id,
    ]);
    if (owned.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const reason = vote === 'down' && isThumbReason(body.reason) ? body.reason : null;
    if (vote === 'down' && !reason) {
      return NextResponse.json({ error: 'Pick what is wrong' }, { status: 400 });
    }
    const message = vote === 'down' && reason === 'other' ? String(body.message || '').trim() : '';
    if (reason === 'other' && (message.length < 3 || message.length > 4000)) {
      return NextResponse.json({ error: 'Write what is wrong, man.' }, { status: 400 });
    }

    const existing = await query(
      `SELECT id FROM feedback
       WHERE user_id = ? AND session_id = ? AND exercise_name = ? AND kind = 'thumb'
       LIMIT 1`,
      [user.id, sessionId, exerciseName]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Already logged this session.' }, { status: 409 });
    }

    try {
      const insert = await query(
        `INSERT INTO feedback (user_id, kind, topic, reason, message, exercise_name, session_id, page_url)
         VALUES (?, 'thumb', NULL, ?, ?, ?, ?, NULL)`,
        [user.id, reason, message, exerciseName, sessionId]
      );
      return NextResponse.json({ success: true, id: insert.insertId, reason, message });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return NextResponse.json({ error: 'Already logged this session.' }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error saving feedback', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
