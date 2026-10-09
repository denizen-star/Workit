import { nthMainWeekLockedAt } from '@/lib/lockedWeeks';
import { parseDbTime } from '@/lib/optionals';
import { PROGRAM_BANNER_SINCE, PROGRAM_UNLOCK_LOCKED_WEEKS, programBannerWindowOpen } from '@/lib/programUnlock';
import { markWeekTakeoverSeen, seenTakeoverKinds } from '@/lib/weekPodium';

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
  return (await programBannersDue(userId))[kind];
}

/** `programBannerDue` for every banner at once: one unlock-date read, one seen read.
 * `unlockedAt` (the 6th main week's lock time) skips the first read when already known. */
export async function programBannersDue(
  userId: number,
  unlockedAtKnown?: string | null
): Promise<Record<ProgramBannerKind, boolean>> {
  const kinds: ProgramBannerKind[] = ['banner_hyrox', 'banner_overload'];
  const [lockedAt, seen] = await Promise.all([
    unlockedAtKnown !== undefined ? unlockedAtKnown : nthMainWeekLockedAt(userId, PROGRAM_UNLOCK_LOCKED_WEEKS),
    seenTakeoverKinds(userId, SEEN_KEY, kinds),
  ]);
  const unlockedAt = parseDbTime(lockedAt);
  const open = unlockedAt != null && programBannerWindowOpen(unlockedAt);
  return {
    banner_hyrox: open && !seen.has('banner_hyrox'),
    banner_overload: open && !seen.has('banner_overload'),
  };
}

export function markProgramBannerSeen(userId: number, kind: ProgramBannerKind): Promise<void> {
  return markWeekTakeoverSeen(userId, SEEN_KEY, kind);
}
