import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { AuthError, requireAdmin } from '@/lib/auth';
import { isFeedbackResolution } from '@/lib/feedback';
import { loadRatingStats } from '@/lib/ratings';
import { sendNow } from '@/lib/emails/send';
import { buildFeedbackDigestEmail, feedbackMailTo } from '@/lib/emails/feedback';

export async function GET() {
  try {
    await requireAdmin();
    let result;
    try {
      result = await query(
        `SELECT
           f.id, f.kind, f.topic, f.reason, f.message, f.exercise_name, f.session_id,
           f.page_url, f.mailed_at, f.resolved_at, f.resolution, f.created_at, u.name as user_name
         FROM feedback f
         INNER JOIN users u ON u.id = f.user_id
         ORDER BY f.resolved_at IS NULL DESC, f.created_at DESC
         LIMIT 200`
      );
    } catch {
      try {
        result = await query(
          `SELECT
             f.id, f.kind, f.topic, f.reason, f.message, f.exercise_name, f.session_id,
             f.page_url, f.mailed_at, f.resolved_at, f.created_at, u.name as user_name
           FROM feedback f
           INNER JOIN users u ON u.id = f.user_id
           ORDER BY f.resolved_at IS NULL DESC, f.created_at DESC
           LIMIT 200`
        );
      } catch {
        result = await query(
          `SELECT
             f.id, f.kind, f.topic, f.reason, f.message, f.exercise_name, f.session_id,
             f.page_url, f.mailed_at, f.created_at, u.name as user_name
           FROM feedback f
           INNER JOIN users u ON u.id = f.user_id
           ORDER BY f.created_at DESC
           LIMIT 200`
        );
      }
    }
    return NextResponse.json({ items: result.rows });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error listing feedback', error);
    return NextResponse.json({ error: 'Failed to load feedback' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json().catch(() => ({}));
    if (body.action === 'resolve') {
      const id = Number(body.id);
      if (!Number.isFinite(id) || id <= 0) {
        return NextResponse.json({ error: 'Note required' }, { status: 400 });
      }
      const resolved = body.resolved !== false;
      const resolution = isFeedbackResolution(body.resolution) ? body.resolution : 'done';
      try {
        if (!resolved) {
          try {
            await query('UPDATE feedback SET resolved_at = NULL, resolution = NULL WHERE id = ?', [id]);
          } catch {
            await query('UPDATE feedback SET resolved_at = NULL WHERE id = ?', [id]);
          }
        } else {
          try {
            await query(
              'UPDATE feedback SET resolved_at = COALESCE(resolved_at, NOW()), resolution = ? WHERE id = ?',
              [resolution, id]
            );
          } catch {
            await query(
              'UPDATE feedback SET resolved_at = COALESCE(resolved_at, NOW()) WHERE id = ?',
              [id]
            );
          }
        }
      } catch {
        return NextResponse.json({ error: 'Could not mark this note' }, { status: 500 });
      }
      return NextResponse.json({ success: true, id, resolved, resolution: resolved ? resolution : null });
    }

    if (body.action !== 'digest') {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    const pending = await query(
      `SELECT f.id, f.kind, f.topic, f.reason, f.message, f.exercise_name, u.name as user_name
       FROM feedback f
       INNER JOIN users u ON u.id = f.user_id
       WHERE f.mailed_at IS NULL
       ORDER BY f.created_at ASC`
    );
    const items = pending.rows as Array<{
      id: number;
      kind: string;
      topic: string | null;
      reason: string | null;
      message: string;
      exercise_name: string | null;
      user_name: string;
    }>;

    const stats = await loadRatingStats();
    const to = feedbackMailTo();
    const id = await sendNow(
      to,
      buildFeedbackDigestEmail({
        stats,
        items: items.map((row) => ({
          kind: row.kind,
          name: row.user_name,
          topic: row.topic,
          reason: row.reason,
          exerciseName: row.exercise_name,
          message: row.message,
        })),
      }),
      { athleteName: admin.name, template: 'feedback_digest' }
    );

    if (!id) {
      return NextResponse.json({ error: 'Could not send digest' }, { status: 500 });
    }

    if (items.length) {
      const ids = items.map((row) => row.id);
      await query(
        `UPDATE feedback SET mailed_at = CURRENT_TIMESTAMP WHERE id IN (${ids.map(() => '?').join(',')})`,
        ids
      );
    }

    return NextResponse.json({ success: true, to, mailed: items.length });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error sending feedback digest', error);
    return NextResponse.json({ error: 'Failed to send digest' }, { status: 500 });
  }
}
