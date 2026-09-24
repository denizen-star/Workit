import { easternYmd } from '@/lib/analyticsTime';
import { query } from '@/lib/db';
import { lockedWeekNumbers } from '@/lib/lockedWeeks';
import { parseDbTime } from '@/lib/optionals';
import { athleteRequiredDays } from '@/lib/scheduleDays';
import { workoutProgram } from '@/lib/workoutData';
import {
  isTimedPickType,
  isYourPickMode,
  isYourPickType,
  pickModesFor,
  yourPickDay,
  yourPickSwapTargets,
  yourPickWeekAllowed,
  YOUR_PICK_DONE_MIN_SECONDS,
  type YourPickMode,
  type YourPickType,
} from '@/lib/yourPick';

/** A validated Your pick start — what POST /api/sessions inserts. */
export type YourPickStart = {
  pickType: YourPickType;
  pickMode: YourPickMode;
  swapForDay: number | null;
  dayNumber: number;
  workoutType: string;
};

type Row = {
  week_number: number;
  day_number: number;
  is_completed: unknown;
  swap_for_day: number | null;
  pick_mode: string | null;
  started_at: string | Date | null;
};

/**
 * Server-side gate for starting a Your pick (docs/plans/PLAN_YOUR_PICK.md). Never
 * trusts the client: main program only, not while Hyrox is active, current week or
 * an earlier unlocked week, a swap only onto an untouched program day, mark done
 * only for Yoga/Core and at most once per Eastern day. Returns the row to insert,
 * or an error message for a 400.
 */
export async function validateYourPickStart(
  userId: number,
  scheduleDays: number,
  input: { weekNumber: unknown; pickType: unknown; pickMode: unknown; swapForDay: unknown }
): Promise<{ ok: true; start: YourPickStart } | { ok: false; error: string }> {
  const weekNumber = Number(input.weekNumber);
  if (!isYourPickType(input.pickType)) return { ok: false, error: 'Unknown Your pick type' };
  const pickType = input.pickType;
  const pickMode: YourPickMode = isYourPickMode(input.pickMode) ? input.pickMode : pickModesFor(pickType)[0];
  if (!pickModesFor(pickType).includes(pickMode)) return { ok: false, error: 'That mode does not fit this pick' };

  const hyrox = await query('SELECT active FROM hyrox_state WHERE user_id = ?', [userId]).catch(() => null);
  if (Number((hyrox?.rows[0] as { active?: number } | undefined)?.active || 0)) {
    return { ok: false, error: 'Your pick is off while Hyrox Training is on' };
  }

  const result = await query(
    `SELECT week_number, day_number, is_completed, swap_for_day, pick_mode, started_at
     FROM workout_sessions WHERE user_id = ? AND program_track = 'main'`,
    [userId]
  );
  const rows = result.rows as Row[];
  const locked = await lockedWeekNumbers(userId);
  if (!yourPickWeekAllowed(weekNumber, rows, locked)) {
    return { ok: false, error: 'Your pick works on this week or an earlier open week' };
  }

  let swapForDay: number | null = null;
  if (input.swapForDay != null && input.swapForDay !== '') {
    const week = workoutProgram.find((item) => item.weekNumber === weekNumber);
    const targets = week ? yourPickSwapTargets(weekNumber, athleteRequiredDays(week, scheduleDays), rows) : [];
    swapForDay = Number(input.swapForDay);
    if (!targets.some((day) => day.dayNumber === swapForDay)) {
      return { ok: false, error: 'That day already started. Swap an unstarted day.' };
    }
  }

  if (pickMode === 'done') {
    const today = easternYmd(new Date());
    const doneToday = rows.some((row) => {
      const started = parseDbTime(row.started_at);
      return row.pick_mode === 'done' && started != null && easternYmd(new Date(started)) === today;
    });
    if (doneToday) return { ok: false, error: 'One mark-done a day. Try the timed flow.' };
  }

  const day = yourPickDay(weekNumber, pickType);
  return {
    ok: true,
    start: { pickType, pickMode, swapForDay, dayNumber: day.dayNumber, workoutType: day.name },
  };
}

/** Mark done can't finish before 30 minutes of wall clock (YOUR_PICK_DONE_MIN_SECONDS). */
export function markDoneTooSoon(
  session: { pick_type?: string | null; pick_mode?: string | null; started_at?: string | Date | null },
  now = Date.now()
): boolean {
  if (session.pick_mode !== 'done' || !isTimedPickType(session.pick_type)) return false;
  const started = parseDbTime(session.started_at);
  if (started == null) return true;
  return now - started < YOUR_PICK_DONE_MIN_SECONDS * 1000;
}
