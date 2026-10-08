// Server-side state for Overload Progressions (docs/plans/PLAN_OVERLOAD_PROGRESSIONS.md).
// Mirrors Hyrox's hyrox_state pattern (app/api/hyrox/route.ts), with three differences:
// - Each run gets its own week-number band (lib/overloadProgram.ts), so "this run's
//   sessions" is a week range, not a started_at cutoff.
// - A run is opted into any day but only *runs* from its Eastern Monday (`starts_on`);
//   until then the athlete keeps training the main program.
// - Diploma tiers are calendar-based (weeks 2 / 4 / 6 ended while still in the run),
//   awarded compute-on-read like the week podium.
import { query } from '@/lib/db';
import { loadWeekSessions } from '@/lib/lockedWeeks';
import { mainProgramNextDay, type WorkoutSessionRow } from '@/lib/nextWorkout';
import { closeProgramRun } from '@/lib/morePrograms';
import { addEasternCalendarDays, calendarDaysBetween, easternMondayKey, easternWeekday, easternYmd } from '@/lib/analyticsTime';
import {
  OVERLOAD_WEEKS,
  isOverloadWeek,
  overloadDisplayWeek,
  overloadRunOf,
  overloadWeekNumber,
} from '@/lib/overloadProgram';

export interface OverloadStateRow {
  user_id: number;
  active: number | boolean;
  run_number: number;
  starts_on: string;
  normal_week_at_start: number;
  normal_day_at_start: number;
  started_at: string | null;
  ended_at: string | null;
}

export type OverloadDiplomaRow = { run_number: number; tier: number; earned_at: string; seen_at: string | null };

/** Diploma tiers: tier N lands when calendar week 2N of the run has ended. */
export const OVERLOAD_DIPLOMA_TIERS = [1, 2, 3] as const;
const DAYS_PER_TIER = 14;

export function todayEasternYmd(now = new Date()): string {
  return easternYmd(now);
}

/** The Monday a new run starts: today if it's Monday (Eastern), else next Monday. */
export function nextRunMonday(now = new Date()): string {
  const monday = easternMondayKey(now);
  return easternWeekday(now) === 1 ? monday : addEasternCalendarDays(monday, 7);
}

/** starts_on can come back as a Date or 'YYYY-MM-DD…' depending on the driver path. */
function ymdOf(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value || '').slice(0, 10);
}

export async function loadOverloadState(userId: number): Promise<OverloadStateRow | null> {
  const result = await query('SELECT * FROM overload_state WHERE user_id = ?', [userId]);
  const row = result.rows[0] as OverloadStateRow | undefined;
  return row ? { ...row, starts_on: ymdOf(row.starts_on) } : null;
}

/** Active AND past its start Monday — the only time Overload sessions may start. */
export function overloadRunning(state: OverloadStateRow | null, now = new Date()): boolean {
  return Boolean(state?.active) && todayEasternYmd(now) >= state!.starts_on;
}

/** Calendar week of the run today (1-6), or 0 before it starts / 7 once it's over. */
export function overloadCalendarWeek(state: Pick<OverloadStateRow, 'starts_on'>, now = new Date()): number {
  const today = todayEasternYmd(now);
  if (today < state.starts_on) return 0;
  for (let week = 1; week <= OVERLOAD_WEEKS; week++) {
    if (today < addEasternCalendarDays(state.starts_on, week * 7)) return week;
  }
  return OVERLOAD_WEEKS + 1;
}

/** Days until the run's Monday (0 once it has started). */
export function daysUntilStart(state: Pick<OverloadStateRow, 'starts_on'>, now = new Date()): number {
  const today = todayEasternYmd(now);
  if (today >= state.starts_on) return 0;
  return calendarDaysBetween(today, state.starts_on);
}

/** Server check for POST /api/sessions on an Overload week: the athlete must be in a
 * running run, and the week must belong to that run. */
export async function validateOverloadStart(
  userId: number,
  weekNumber: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isOverloadWeek(weekNumber)) return { ok: false, error: 'Not an Overload Progressions week' };
  const state = await loadOverloadState(userId);
  if (!state?.active) return { ok: false, error: 'Overload Progressions is not active' };
  if (!overloadRunning(state)) return { ok: false, error: 'Overload Progressions starts Monday' };
  if (overloadRunOf(weekNumber) !== Number(state.run_number)) {
    return { ok: false, error: 'That week is not part of this run' };
  }
  const display = overloadDisplayWeek(weekNumber);
  if (display < 1 || display > OVERLOAD_WEEKS) return { ok: false, error: 'Unknown week' };
  return { ok: true };
}


/** Weeks locked in this run (persisted `locked_weeks`, lib/lockedWeeks.ts) — how far
 * the main program jumps ahead on leave, same idea as Hyrox's `hyroxWeeksElapsed`. */
export async function overloadWeeksLocked(userId: number, run: number): Promise<number> {
  const result = await query(
    'SELECT COUNT(*) as n FROM locked_weeks WHERE user_id = ? AND week_number BETWEEN ? AND ?',
    [userId, overloadWeekNumber(run, 1), overloadWeekNumber(run, OVERLOAD_WEEKS)]
  );
  return Number((result.rows[0] as { n?: number } | undefined)?.n || 0);
}

/** Awards every tier whose calendar week has ended. Idempotent (unique user+run+tier). */
export async function awardDueDiplomas(userId: number, state: OverloadStateRow, now = new Date()): Promise<void> {
  const today = todayEasternYmd(now);
  for (const tier of OVERLOAD_DIPLOMA_TIERS) {
    if (today < addEasternCalendarDays(state.starts_on, tier * DAYS_PER_TIER)) break;
    await query(
      `INSERT INTO overload_diplomas (user_id, run_number, tier, earned_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE earned_at = earned_at`,
      [userId, state.run_number, tier]
    );
  }
}

export async function loadOverloadDiplomas(userId: number): Promise<OverloadDiplomaRow[]> {
  const result = await query(
    'SELECT run_number, tier, earned_at, seen_at FROM overload_diplomas WHERE user_id = ? ORDER BY run_number, tier',
    [userId]
  );
  return result.rows as OverloadDiplomaRow[];
}

/** Ends the active run: awards any tier already due, then moves the main program's
 * resume floor ahead by the weeks locked this run. Returns that floor. */
export async function endOverloadRun(userId: number, state: OverloadStateRow): Promise<number> {
  await awardDueDiplomas(userId, state);
  const resumeWeek = Number(state.normal_week_at_start) + (await overloadWeeksLocked(userId, state.run_number));
  await closeProgramRun(userId, 'overload', resumeWeek);
  return resumeWeek;
}

/** Floor the 48-week program resumes at once a Hyrox or Overload run has ended —
 * the later of the two, since either may have moved it (1 = no floor). */
export async function mainResumeFloor(userId: number): Promise<number> {
  return (await mainResumeFloors([userId])).get(userId) ?? 1;
}

/** `mainResumeFloor` for several athletes in one read (the daily nudge run). */
export async function mainResumeFloors(userIds: number[]): Promise<Map<number, number>> {
  const floors = new Map<number, number>(userIds.map((id) => [id, 1]));
  if (userIds.length === 0) return floors;
  const list = userIds.map(() => '?').join(', ');
  const result = await query(
    `SELECT user_id, normal_week_at_start AS floor FROM hyrox_state WHERE active = 0 AND user_id IN (${list})
     UNION ALL
     SELECT user_id, normal_week_at_start AS floor FROM overload_state WHERE active = 0 AND user_id IN (${list})`,
    [...userIds, ...userIds]
  );
  for (const row of result.rows as { user_id: number; floor: number | null }[]) {
    const id = Number(row.user_id);
    floors.set(id, Math.max(floors.get(id) ?? 1, Number(row.floor || 1)));
  }
  return floors;
}

/** Where the main program stands right now, past any earlier floor — what a Hyrox or
 * Overload start snapshots so the athlete resumes there after leaving. */
export async function mainProgramSnapshot(
  userId: number,
  scheduleDays: number
): Promise<{ week: number; day: number }> {
  const [sessions, floor] = await Promise.all([loadWeekSessions(userId, 'main'), mainResumeFloor(userId)]);
  const position = mainProgramNextDay(sessions as unknown as WorkoutSessionRow[], floor, scheduleDays);
  return { week: position?.week.weekNumber ?? floor, day: position?.day.dayNumber ?? 1 };
}
