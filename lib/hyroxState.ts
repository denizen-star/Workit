import { requiredDays } from '@/lib/bonusDay';
import { hyroxProgram } from '@/lib/hyroxProgram';
import { query } from '@/lib/db';
import type { WorkoutSessionRow } from '@/lib/nextWorkout';

export interface HyroxStateRow {
  user_id: number;
  active: number | boolean;
  hyrox_week: number;
  normal_week_at_start: number;
  normal_day_at_start: number;
  started_at: string | null;
  ended_at: string | null;
}

/** Locked Hyrox weeks so far. Not the persisted `locked_weeks` table
 * (`lib/lockedWeeks.ts`) — that's the normal program's own required-count-per-athlete
 * tracking, but Hyrox weeks always need all 5, regardless of that setting. */
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

/** Every session row the Hyrox reads need (all tracks; filter with `hyroxSessionsThisRun`). */
export type HyroxSessionRow = Pick<WorkoutSessionRow, 'week_number' | 'day_number' | 'is_completed'> & {
  program_track?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
};

export async function loadHyroxRunSessions(userId: number): Promise<HyroxSessionRow[]> {
  const result = await query(
    'SELECT week_number, day_number, is_completed, program_track, completed_at, created_at FROM workout_sessions WHERE user_id = ?',
    [userId]
  );
  return result.rows as HyroxSessionRow[];
}

/** Hyrox sessions from the CURRENT run only. Leaving and starting over always
 * begins at Week 1 — a prior (ended) run's completed sessions must not make
 * findNextProgramDay think locked weeks are already behind them. */
export function hyroxSessionsThisRun(sessions: HyroxSessionRow[], startedAt: string | null | undefined): HyroxSessionRow[] {
  const cutoff = startedAt ? new Date(startedAt).getTime() : 0;
  return sessions.filter((row) => {
    if (row.program_track !== 'hyrox') return false;
    if (!cutoff) return true;
    const when = new Date(row.completed_at || row.created_at || 0).getTime();
    return when >= cutoff;
  });
}
