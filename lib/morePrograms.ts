import { query } from '@/lib/db';
import { lockedMainWeekCount } from '@/lib/lockedWeeks';
import { markProgramBannerSeen } from '@/lib/programBanner';
import type { OptInTrack } from '@/lib/programTrack';
import { MORE_PROGRAMS, programLabel, programUnlocked } from '@/lib/programUnlock';

/**
 * Server rules every More program shares (docs/plans/PLAN_MORE_PROGRAMS.md): one
 * program at a time, one unlock gate, one way to close a run, one banner action.
 * Each program keeps only what's truly its own (Hyrox milestones, Overload runs).
 */

/** Each program's one-row-per-athlete state table. */
const STATE_TABLE: Record<OptInTrack, string> = {
  hyrox: 'hyrox_state',
  overload: 'overload_state',
};

/** Is this program active for the athlete? A missing table (migration not applied) reads as no. */
export async function programActive(userId: number, track: OptInTrack): Promise<boolean> {
  try {
    const result = await query(`SELECT active FROM ${STATE_TABLE[track]} WHERE user_id = ?`, [userId]);
    return Boolean(Number((result.rows[0] as { active?: number } | undefined)?.active));
  } catch {
    return false;
  }
}

/** Why `track` can't start right now (another program is active, or the athlete hasn't
 * locked enough main weeks), or null when it can. */
export async function programStartRefusal(
  userId: number,
  track: OptInTrack
): Promise<{ error: string; status: number } | null> {
  for (const { track: other } of MORE_PROGRAMS) {
    if (other !== track && (await programActive(userId, other))) {
      return { error: `Leave ${programLabel(other)} first`, status: 409 };
    }
  }
  if (!programUnlocked(await lockedMainWeekCount(userId))) {
    return { error: 'Not eligible yet', status: 403 };
  }
  return null;
}

/** Ends the athlete's run and sets where the main program resumes. */
export async function closeProgramRun(userId: number, track: OptInTrack, resumeWeek: number): Promise<void> {
  await query(
    `UPDATE ${STATE_TABLE[track]}
     SET active = 0, ended_at = NOW(), normal_week_at_start = ?, normal_day_at_start = 1
     WHERE user_id = ?`,
    [resumeWeek, userId]
  );
}

/** Home banner tapped or ✕'d — never shows again for this account. */
export function markProgramBannerTapped(userId: number, track: OptInTrack): Promise<void> {
  return markProgramBannerSeen(userId, `banner_${track}`);
}
