import type { SessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { hyroxDisplayWeek, hyroxProgram } from '@/lib/hyroxProgram';
import { hyroxSessionsThisRun, loadHyroxRunSessions, type HyroxStateRow } from '@/lib/hyroxState';
import {
  lockedMainWeekCount,
  mainLockedCount,
  nthMainLockedAt,
  type LockedWeekRecord,
} from '@/lib/lockedWeeks';
import { findNextProgramDay, type WorkoutSessionRow } from '@/lib/nextWorkout';
import { OVERLOAD_WEEKS, overloadDisplayWeek, overloadProgram, overloadWeekNumber } from '@/lib/overloadProgram';
import {
  awardDueDiplomas,
  daysUntilStart,
  endOverloadRun,
  loadOverloadDiplomas,
  loadOverloadState,
  overloadCalendarWeek,
  overloadRunning,
} from '@/lib/overloadState';
import { programBannersDue } from '@/lib/programBanner';
import { PROGRAM_UNLOCK_LOCKED_WEEKS, programUnlocked } from '@/lib/programUnlock';
import { daysForWeekFn } from '@/lib/scheduleDays';

/**
 * Both More programs' state for Home, Select Workout and the menu
 * (`GET /api/programs`, docs/plans/PLAN_MORE_PROGRAMS.md). What both share — locked
 * main weeks (the unlock gate and the menu's "N of 6") and the banner checks — is read
 * once; each program then reads only its own tables.
 */
export async function moreProgramsStatus(
  user: SessionUser,
  /** This athlete's `locked_weeks` rows, already read or in flight (GET /api/home). */
  lockedRecordsIn?: LockedWeekRecord[] | Promise<LockedWeekRecord[]>
) {
  const lockedRecords = lockedRecordsIn ? await lockedRecordsIn : undefined;
  const [lockedWeeks, banners] = await Promise.all([
    lockedRecords ? mainLockedCount(lockedRecords) : lockedMainWeekCount(user.id),
    programBannersDue(
      user.id,
      lockedRecords ? nthMainLockedAt(lockedRecords, PROGRAM_UNLOCK_LOCKED_WEEKS) : undefined
    ),
  ]);
  const eligible = programUnlocked(lockedWeeks);
  const [hyrox, overload] = await Promise.all([
    hyroxStatus(user, eligible, banners.banner_hyrox),
    overloadStatus(user, eligible, banners.banner_overload),
  ]);
  return { lockedWeeks, hyrox: { ...hyrox, lockedWeeks }, overload: { ...overload, lockedWeeks } };
}

/** Hyrox Training: this run's next day, milestones and diplomas. */
async function hyroxStatus(user: SessionUser, eligible: boolean, bannerOpen: boolean) {
  const [stateResult, milestonesResult, diplomasResult] = await Promise.all([
    query('SELECT * FROM hyrox_state WHERE user_id = ?', [user.id]),
    query(
      'SELECT milestone_number, result, decided_at FROM hyrox_milestones WHERE user_id = ? ORDER BY decided_at DESC',
      [user.id]
    ),
    query('SELECT tier, earned_at FROM hyrox_diplomas WHERE user_id = ? ORDER BY tier ASC', [user.id]),
  ]);
  const state = (stateResult.rows[0] as HyroxStateRow | undefined) || null;
  const active = Boolean(state?.active);
  // Sessions only matter during a run (most athletes aren't in one), so they're read only then.
  const hyroxSessions = active
    ? hyroxSessionsThisRun(await loadHyroxRunSessions(user.id), state?.started_at)
    : [];
  const next = active
    ? findNextProgramDay(hyroxSessions as WorkoutSessionRow[], hyroxProgram, 1, daysForWeekFn(user.scheduleDaysPerWeek))
    : null;

  return {
    eligible,
    active,
    // Home's 3-day banner (lib/programBanner.ts).
    bannerDue: eligible && !active && bannerOpen,
    state: state
      ? {
          hyroxWeek: next ? hyroxDisplayWeek(next.week.weekNumber) : null,
          startedAt: state.started_at,
          normalWeekAtStart: state.normal_week_at_start,
        }
      : null,
    today: next
      ? {
          // Stored week_number and display week, same shape as Overload's.
          weekNumber: next.week.weekNumber,
          week: hyroxDisplayWeek(next.week.weekNumber),
          day: next.day.dayNumber,
          name: next.day.name,
          milestone: next.day.milestone ?? null,
        }
      : null,
    phaseComplete: active && !next,
    milestones: milestonesResult.rows,
    diplomas: diplomasResult.rows,
  };
}

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

/** Overload Progressions: this run's next day and diplomas. Diplomas are awarded here
 * on read, and a run whose sixth calendar week has ended is closed here too. */
async function overloadStatus(user: SessionUser, eligible: boolean, bannerOpen: boolean) {
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
  // Diplomas are awarded above, so these reads come after it — but not after each other.
  const [sessions, diplomas] = await Promise.all([
    running ? runSessions(user.id, run) : [],
    loadOverloadDiplomas(user.id),
  ]);
  const next = running
    ? findNextProgramDay(sessions, overloadProgram(run, user.scheduleDaysPerWeek), 1, daysForWeekFn(user.scheduleDaysPerWeek))
    : null;

  return {
    eligible,
    active,
    // Home's 3-day banner (lib/programBanner.ts).
    bannerDue: eligible && !active && bannerOpen,
    running,
    run,
    startsOn: state?.starts_on ?? null,
    daysUntilStart: state && active ? daysUntilStart(state) : 0,
    calendarWeek: state && running ? overloadCalendarWeek(state) : 0,
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
  };
}
