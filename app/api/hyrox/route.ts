import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hyroxProgram } from '@/lib/hyroxProgram';
import {
  hyroxSessionsThisRun,
  hyroxWeeksElapsed,
  loadHyroxRunSessions,
  resumeNormalWeek,
  type HyroxStateRow,
} from '@/lib/hyroxState';
import { isSessionComplete } from '@/lib/nextWorkout';
import { mainProgramSnapshot } from '@/lib/overloadState';
import { closeProgramRun, markProgramBannerTapped, programActive, programStartRefusal } from '@/lib/morePrograms';

/** Hyrox Training actions (start / milestone / drop / bannerSeen). Its state comes
 * from GET /api/programs (lib/programStatus.ts). */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body?.action || '');

  if (action === 'start') {
    // Idempotent: a double-tap or a second tab re-sending 'start' while already
    // active must not reset started_at — hyroxSessionsThisRun filters on it, so
    // resetting it would silently hide every session logged in the run so far.
    if (await programActive(user.id, 'hyrox')) {
      return NextResponse.json({ success: true, alreadyActive: true });
    }

    // One More program at a time, same unlock gate (lib/morePrograms.ts).
    const refusal = await programStartRefusal(user.id, 'hyrox');
    if (refusal) return NextResponse.json({ error: refusal.error }, { status: refusal.status });

    // Same snapshot as Overload's start: past any earlier Hyrox/Overload floor.
    const { week: normalWeek, day: normalDay } = await mainProgramSnapshot(user.id, user.scheduleDaysPerWeek);

    await query(
      `INSERT INTO hyrox_state (user_id, active, hyrox_week, normal_week_at_start, normal_day_at_start, started_at, ended_at)
       VALUES (?, 1, 1, ?, ?, NOW(), NULL)
       ON DUPLICATE KEY UPDATE active = 1, hyrox_week = 1, normal_week_at_start = ?, normal_day_at_start = ?, started_at = NOW(), ended_at = NULL`,
      [user.id, normalWeek, normalDay, normalWeek, normalDay]
    );

    return NextResponse.json({ success: true, normalWeek, normalDay });
  }

  if (action === 'milestone') {
    const milestoneNumber = Number(body?.milestoneNumber);
    const passed = Boolean(body?.passed);
    if (!milestoneNumber) {
      return NextResponse.json({ error: 'milestoneNumber required' }, { status: 400 });
    }

    const stateResult = await query('SELECT * FROM hyrox_state WHERE user_id = ?', [user.id]);
    const state = stateResult.rows[0] as HyroxStateRow | undefined;
    if (!state?.active) {
      return NextResponse.json({ error: 'No active Hyrox track' }, { status: 400 });
    }

    // Confirm this milestone belongs to a day the athlete actually completed this
    // run, rather than trusting an arbitrary milestoneNumber from the client.
    let milestoneDay: { weekNumber: number; dayNumber: number } | null = null;
    for (const week of hyroxProgram) {
      const day = week.days.find((item) => item.milestone === milestoneNumber);
      if (day) {
        milestoneDay = { weekNumber: week.weekNumber, dayNumber: day.dayNumber };
        break;
      }
    }
    if (!milestoneDay) {
      return NextResponse.json({ error: 'Unknown milestone' }, { status: 400 });
    }
    const allSessions = await loadHyroxRunSessions(user.id);
    const completedThisRun = hyroxSessionsThisRun(allSessions, state.started_at).some(
      (row) =>
        isSessionComplete({ is_completed: row.is_completed }) &&
        Number(row.week_number) === milestoneDay!.weekNumber &&
        Number(row.day_number) === milestoneDay!.dayNumber
    );
    if (!completedThisRun) {
      return NextResponse.json({ error: 'Milestone day not completed yet' }, { status: 400 });
    }

    await query(
      'INSERT INTO hyrox_milestones (user_id, milestone_number, result) VALUES (?, ?, ?)',
      [user.id, milestoneNumber, passed ? 'pass' : 'fail']
    );

    if (passed) {
      await query(
        'INSERT INTO hyrox_diplomas (user_id, tier, earned_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE earned_at = earned_at',
        [user.id, milestoneNumber]
      );
    }

    return NextResponse.json({ success: true });
  }

  if (action === 'drop') {
    const stateResult = await query('SELECT * FROM hyrox_state WHERE user_id = ?', [user.id]);
    const state = stateResult.rows[0] as HyroxStateRow | undefined;
    if (!state || !state.active) {
      return NextResponse.json({ error: 'No active Hyrox track' }, { status: 400 });
    }

    const allSessions = await loadHyroxRunSessions(user.id);
    const hyroxSessions = hyroxSessionsThisRun(allSessions, state.started_at).filter((row) =>
      isSessionComplete({ is_completed: row.is_completed })
    );
    const weeksElapsed = hyroxWeeksElapsed(hyroxSessions);
    const resumeWeek = resumeNormalWeek(state, weeksElapsed);

    await closeProgramRun(user.id, 'hyrox', resumeWeek);

    return NextResponse.json({ success: true, resumeWeek });
  }

  // Home banner tapped or ✕'d — never shows again for this account.
  if (action === 'bannerSeen') {
    await markProgramBannerTapped(user.id, 'hyrox');
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
