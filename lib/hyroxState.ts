import { requiredDays } from '@/lib/bonusDay';
import { hyroxProgram } from '@/lib/hyroxProgram';

export interface HyroxStateRow {
  user_id: number;
  active: number | boolean;
  hyrox_week: number;
  normal_week_at_start: number;
  normal_day_at_start: number;
  started_at: string | null;
  ended_at: string | null;
}

/** Locked Hyrox weeks so far. Not `lib/belts.ts`'s `lockedWeekCount` — that hardcodes
 * the normal program's fixed 4-day requirement, but Hyrox weeks need all 5. */
export function hyroxWeeksElapsed(
  hyroxSessions: Array<{ week_number?: number; is_completed?: unknown }>
): number {
  const completedByWeek = new Map<number, number>();
  for (const session of hyroxSessions) {
    if (!Number(session.is_completed)) continue;
    const week = Number(session.week_number);
    if (!week) continue;
    completedByWeek.set(week, (completedByWeek.get(week) || 0) + 1);
  }

  let count = 0;
  for (const week of hyroxProgram) {
    const required = requiredDays(week).length;
    if ((completedByWeek.get(week.weekNumber) || 0) >= required) count += 1;
  }
  return count;
}

/** Normal-program week to resume at on exit: where they started, plus weeks actually completed in Hyrox. */
export function resumeNormalWeek(
  state: Pick<HyroxStateRow, 'normal_week_at_start'>,
  weeksElapsed: number
): number {
  return Number(state.normal_week_at_start) + weeksElapsed;
}
