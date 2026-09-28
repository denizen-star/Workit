import { nthMainWeekLockedAt } from '@/lib/lockedWeeks';
import { parseDbTime } from '@/lib/optionals';
import { PROGRAM_BANNER_SINCE, PROGRAM_UNLOCK_LOCKED_WEEKS, programBannerWindowOpen } from '@/lib/programUnlock';
import { hasSeenWeekTakeover, markWeekTakeoverSeen } from '@/lib/weekPodium';

/**
 * Home's one-time "program unlocked" banners (Hyrox, Overload Progressions —
 * docs/plans/PLAN_MORE_PROGRAMS.md). A banner shows until it is tapped or ✕'d, or
 * its 3-day window ends, whichever comes first. "Seen" rides on `week_takeover_seen`
 * (keyed by account, not device) with a fixed `week_monday` sentinel — a banner
 * shows once per account, ever, so there is no real week to key on.
 */
export type ProgramBannerKind = 'banner_hyrox' | 'banner_overload';

const SEEN_KEY = PROGRAM_BANNER_SINCE.slice(0, 10);

/** Unlocked, inside the 3-day window, and not yet tapped or dismissed. Callers
 * also check the program is not already active. */
export async function programBannerDue(userId: number, kind: ProgramBannerKind): Promise<boolean> {
  const unlockedAt = parseDbTime(await nthMainWeekLockedAt(userId, PROGRAM_UNLOCK_LOCKED_WEEKS));
  if (unlockedAt == null || !programBannerWindowOpen(unlockedAt)) return false;
  return !(await hasSeenWeekTakeover(userId, SEEN_KEY, kind));
}

export function markProgramBannerSeen(userId: number, kind: ProgramBannerKind): Promise<void> {
  return markWeekTakeoverSeen(userId, SEEN_KEY, kind);
}
