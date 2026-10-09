import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { endOverloadRun, loadOverloadState, mainProgramSnapshot, nextRunMonday } from '@/lib/overloadState';
import { markProgramBannerTapped, programStartRefusal } from '@/lib/morePrograms';

/** Overload Progressions actions (start / drop / seen / bannerSeen). Its state comes
 * from GET /api/programs (lib/programStatus.ts). */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body?.action || '');

  if (action === 'start') {
    const state = await loadOverloadState(user.id);
    // Idempotent: a double tap must not bump the run or move its Monday.
    if (state?.active) {
      return NextResponse.json({ success: true, alreadyActive: true, startsOn: state.starts_on });
    }
    // One More program at a time, same unlock gate (lib/morePrograms.ts).
    const refusal = await programStartRefusal(user.id, 'overload');
    if (refusal) return NextResponse.json({ error: refusal.error }, { status: refusal.status });

    // Snapshot where the main program stands (past any earlier Hyrox/Overload floor).
    const { week: normalWeek, day: normalDay } = await mainProgramSnapshot(user.id, user.scheduleDaysPerWeek);
    const run = Number(state?.run_number || 0) + 1;
    const startsOn = nextRunMonday();

    await query(
      `INSERT INTO overload_state (user_id, active, run_number, starts_on, normal_week_at_start, normal_day_at_start, started_at, ended_at)
       VALUES (?, 1, ?, ?, ?, ?, NOW(), NULL)
       ON DUPLICATE KEY UPDATE active = 1, run_number = ?, starts_on = ?, normal_week_at_start = ?,
         normal_day_at_start = ?, started_at = NOW(), ended_at = NULL`,
      [user.id, run, startsOn, normalWeek, normalDay, run, startsOn, normalWeek, normalDay]
    );
    return NextResponse.json({ success: true, run, startsOn });
  }

  if (action === 'drop') {
    const state = await loadOverloadState(user.id);
    if (!state?.active) {
      return NextResponse.json({ error: 'No active Overload Progressions run' }, { status: 400 });
    }
    const resumeWeek = await endOverloadRun(user.id, state);
    return NextResponse.json({ success: true, resumeWeek });
  }

  if (action === 'seen') {
    const run = Number(body?.run);
    const tier = Number(body?.tier);
    if (!run || !tier) {
      return NextResponse.json({ error: 'run and tier required' }, { status: 400 });
    }
    await query(
      'UPDATE overload_diplomas SET seen_at = NOW() WHERE user_id = ? AND run_number = ? AND tier = ? AND seen_at IS NULL',
      [user.id, run, tier]
    );
    return NextResponse.json({ success: true });
  }

  // Home banner tapped or ✕'d — never shows again for this account.
  if (action === 'bannerSeen') {
    await markProgramBannerTapped(user.id, 'overload');
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
