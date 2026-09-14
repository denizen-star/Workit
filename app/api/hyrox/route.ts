import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { lockedWeekCount } from '@/lib/belts';
import { hyroxEligible } from '@/lib/hyroxEligibility';
import { hyroxDisplayWeek, hyroxProgram } from '@/lib/hyroxProgram';
import { hyroxWeeksElapsed, resumeNormalWeek, type HyroxStateRow } from '@/lib/hyroxState';
import { findNextProgramDay, isSessionComplete, type WorkoutSessionRow } from '@/lib/nextWorkout';
import { workoutProgram } from '@/lib/workoutData';

type SessionRow = Pick<WorkoutSessionRow, 'week_number' | 'day_number' | 'is_completed'> & {
  program_track?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
};

async function loadSessions(userId: number): Promise<SessionRow[]> {
  const result = await query(
    'SELECT week_number, day_number, is_completed, program_track, completed_at, created_at FROM workout_sessions WHERE user_id = ?',
    [userId]
  );
  return result.rows as SessionRow[];
}

/** Hyrox sessions from the CURRENT run only. Leaving and starting over always
 * begins at Week 1 — a prior (ended) run's completed sessions must not make
 * findNextProgramDay think locked weeks are already behind them. */
function hyroxSessionsThisRun(sessions: SessionRow[], startedAt: string | null | undefined): SessionRow[] {
  const cutoff = startedAt ? new Date(startedAt).getTime() : 0;
  return sessions.filter((row) => {
    if (row.program_track !== 'hyrox') return false;
    if (!cutoff) return true;
    const when = new Date(row.completed_at || row.created_at || 0).getTime();
    return when >= cutoff;
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const allSessions = await loadSessions(user.id);
  const mainSessions = allSessions.filter((row) => (row.program_track || 'main') === 'main');

  const stateResult = await query('SELECT * FROM hyrox_state WHERE user_id = ?', [user.id]);
  const state = (stateResult.rows[0] as HyroxStateRow | undefined) || null;
  const hyroxSessions = hyroxSessionsThisRun(allSessions, state?.started_at);

  const milestonesResult = await query(
    'SELECT milestone_number, result, decided_at FROM hyrox_milestones WHERE user_id = ? ORDER BY decided_at DESC',
    [user.id]
  );
  const diplomasResult = await query(
    'SELECT tier, earned_at FROM hyrox_diplomas WHERE user_id = ? ORDER BY tier ASC',
    [user.id]
  );

  const active = Boolean(state?.active);
  const next = active ? findNextProgramDay(hyroxSessions as WorkoutSessionRow[], hyroxProgram) : null;

  // Once a Hyrox run has ended, normal_week_at_start doubles as the floor the
  // normal 48-week program should resume at (see POST action=drop).
  const resumeFloor = state && !active ? Number(state.normal_week_at_start) : 1;

  return NextResponse.json({
    eligible: hyroxEligible(mainSessions),
    active,
    resumeFloor,
    state: state
      ? {
          hyroxWeek: next ? hyroxDisplayWeek(next.week.weekNumber) : null,
          startedAt: state.started_at,
          normalWeekAtStart: state.normal_week_at_start,
        }
      : null,
    today: next
      ? {
          week: hyroxDisplayWeek(next.week.weekNumber),
          day: next.day.dayNumber,
          name: next.day.name,
          milestone: next.day.milestone ?? null,
        }
      : null,
    phaseComplete: active && !next,
    milestones: milestonesResult.rows,
    diplomas: diplomasResult.rows,
  });
}

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
    const existingState = await query('SELECT active FROM hyrox_state WHERE user_id = ?', [user.id]);
    if (Boolean((existingState.rows[0] as { active?: number } | undefined)?.active)) {
      return NextResponse.json({ success: true, alreadyActive: true });
    }

    const allSessions = await loadSessions(user.id);
    const mainSessions = allSessions.filter((row) => (row.program_track || 'main') === 'main');
    if (!hyroxEligible(mainSessions)) {
      return NextResponse.json({ error: 'Not eligible yet' }, { status: 403 });
    }

    const position = findNextProgramDay(mainSessions as WorkoutSessionRow[], workoutProgram);
    const normalWeek = position?.week.weekNumber ?? 1;
    const normalDay = position?.day.dayNumber ?? 1;

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
    const allSessions = await loadSessions(user.id);
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

    const allSessions = await loadSessions(user.id);
    const hyroxSessions = hyroxSessionsThisRun(allSessions, state.started_at).filter((row) =>
      isSessionComplete({ is_completed: row.is_completed })
    );
    const weeksElapsed = hyroxWeeksElapsed(hyroxSessions);
    const resumeWeek = resumeNormalWeek(state, weeksElapsed);

    await query(
      `UPDATE hyrox_state
       SET active = 0, ended_at = NOW(), normal_week_at_start = ?, normal_day_at_start = 1
       WHERE user_id = ?`,
      [resumeWeek, user.id]
    );

    return NextResponse.json({ success: true, resumeWeek });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
