import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { findNextProgramDay, type WorkoutSessionRow } from '@/lib/nextWorkout';
import {
  OVERLOAD_WEEKS,
  overloadDisplayWeek,
  overloadProgram,
  overloadWeekNumber,
} from '@/lib/overloadProgram';
import {
  awardDueDiplomas,
  daysUntilStart,
  endOverloadRun,
  loadOverloadDiplomas,
  loadOverloadState,
  mainResumeFloor,
  nextRunMonday,
  overloadEligible,
  overloadCalendarWeek,
  overloadRunning,
} from '@/lib/overloadState';
import { daysForWeekFn } from '@/lib/scheduleDays';
import { workoutProgram } from '@/lib/workoutData';

/** This run's Overload sessions — each run owns its own week band (lib/overloadProgram.ts). */
async function runSessions(userId: number, run: number): Promise<WorkoutSessionRow[]> {
  const result = await query(
    `SELECT id, week_number, day_number, workout_type, is_completed, started_at, completed_at, created_at
     FROM workout_sessions
     WHERE user_id = ? AND program_track = 'overload' AND week_number BETWEEN ? AND ?`,
    [userId, overloadWeekNumber(run, 1), overloadWeekNumber(run, OVERLOAD_WEEKS)]
  );
  return result.rows as WorkoutSessionRow[];
}

/** Overload Progressions state for Home, Select Workout and the menu
 * (docs/plans/PLAN_OVERLOAD_PROGRESSIONS.md). Diplomas are awarded here on read,
 * and a run whose sixth calendar week has ended is closed here too. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let state = await loadOverloadState(user.id);
  if (state?.active && overloadRunning(state)) {
    await awardDueDiplomas(user.id, state);
    if (overloadCalendarWeek(state) > OVERLOAD_WEEKS) {
      await endOverloadRun(user.id, state);
      state = await loadOverloadState(user.id);
    }
  }

  const active = Boolean(state?.active);
  const running = overloadRunning(state);
  const run = Number(state?.run_number || 0);
  const sessions = running ? await runSessions(user.id, run) : [];
  const next = running ? findNextProgramDay(sessions, overloadProgram(run, user.scheduleDaysPerWeek)) : null;
  const diplomas = await loadOverloadDiplomas(user.id);

  return NextResponse.json({
    eligible: await overloadEligible(user.id),
    active,
    running,
    run,
    startsOn: state?.starts_on ?? null,
    daysUntilStart: state && active ? daysUntilStart(state) : 0,
    calendarWeek: state && running ? overloadCalendarWeek(state) : 0,
    resumeFloor: await mainResumeFloor(user.id),
    today: next
      ? {
          weekNumber: next.week.weekNumber,
          week: overloadDisplayWeek(next.week.weekNumber),
          day: next.day.dayNumber,
          name: next.day.name,
        }
      : null,
    // Every week of this run locked before the calendar ran out.
    seriesComplete: running && !next,
    diplomas: diplomas.map((row) => ({ run: Number(row.run_number), tier: Number(row.tier), earnedAt: row.earned_at })),
    // Oldest unseen tier first — Home shows one takeover per open, then POSTs `seen`.
    unseenDiploma:
      diplomas
        .filter((row) => !row.seen_at)
        .map((row) => ({ run: Number(row.run_number), tier: Number(row.tier) }))[0] ?? null,
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
    const state = await loadOverloadState(user.id);
    // Idempotent: a double tap must not bump the run or move its Monday.
    if (state?.active) {
      return NextResponse.json({ success: true, alreadyActive: true, startsOn: state.starts_on });
    }
    // One opt-in track at a time.
    const hyrox = await query('SELECT active FROM hyrox_state WHERE user_id = ?', [user.id]);
    if (Boolean(Number((hyrox.rows[0] as { active?: number } | undefined)?.active))) {
      return NextResponse.json({ error: 'Leave Hyrox Training first' }, { status: 409 });
    }
    if (!(await overloadEligible(user.id))) {
      return NextResponse.json({ error: 'Not eligible yet' }, { status: 403 });
    }

    // Snapshot where the main program stands (past any earlier Hyrox/Overload floor).
    const main = await query(
      `SELECT week_number, day_number, is_completed, swap_for_day, pick_type
       FROM workout_sessions WHERE user_id = ? AND program_track = 'main'`,
      [user.id]
    );
    const floor = await mainResumeFloor(user.id);
    const position = findNextProgramDay(
      main.rows as WorkoutSessionRow[],
      workoutProgram,
      floor,
      daysForWeekFn(user.scheduleDaysPerWeek)
    );
    const normalWeek = position?.week.weekNumber ?? floor;
    const normalDay = position?.day.dayNumber ?? 1;
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

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
