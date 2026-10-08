/**
 * One unlock rule for the opt-in programs in the menu's **More programs** section
 * (Hyrox Training, Overload Progressions — docs/plans/PLAN_MORE_PROGRAMS.md).
 * Client-safe: the menu reads these for its lock hint and "N of 6" line; the
 * server-side banner check lives in lib/programBanner.ts.
 */

import type { OptInTrack } from '@/lib/programTrack';

/** Every More program, in menu order, with the name athletes see. */
export const MORE_PROGRAMS: { track: OptInTrack; label: string }[] = [
  { track: 'hyrox', label: 'Hyrox Training' },
  { track: 'overload', label: 'Overload Progressions' },
];

export function programLabel(track: OptInTrack): string {
  return MORE_PROGRAMS.find((program) => program.track === track)?.label ?? track;
}

/** Home's hand-off link for a More program (the menu on any other page). Home also
 * still reads the older `?hyrox=1` / `?overload=1` links. */
export function programIntroHref(track: OptInTrack): string {
  return `/home?program=${track}`;
}

/** The More program a Home URL hands off to: `?program=<track>`, or the older
 * `?hyrox=1` / `?overload=1` links already out there. */
export function programFromSearch(search: string): OptInTrack | null {
  const params = new URLSearchParams(search);
  const named = params.get('program');
  const tracks = MORE_PROGRAMS.map((program) => program.track);
  if (named && (tracks as string[]).includes(named)) return named as OptInTrack;
  return tracks.find((track) => params.get(track) === '1') ?? null;
}

/** Locked main-program weeks (1–48, `locked_weeks`) that open every More program. */
export const PROGRAM_UNLOCK_LOCKED_WEEKS = 6;

/** Each program's Home banner shows for this many days after unlocking. */
export const PROGRAM_BANNER_DAYS = 3;

/** Release of the 3-day banner rule. Athletes who unlocked earlier get their 3 days
 * from here instead (backfilled `locked_at` values are all the migration date). */
export const PROGRAM_BANNER_SINCE = '2026-09-27T04:00:00Z'; // midnight Eastern (EDT)

export const PROGRAM_LOCKED_HINT = `Unlocks after ${PROGRAM_UNLOCK_LOCKED_WEEKS} locked weeks`;

export function programUnlocked(lockedMainWeeks: number): boolean {
  return lockedMainWeeks >= PROGRAM_UNLOCK_LOCKED_WEEKS;
}

/** "3 of 6 weeks locked" — what's left before a locked program opens. */
export function programUnlockProgress(lockedMainWeeks: number): string {
  const done = Math.min(Math.max(0, lockedMainWeeks), PROGRAM_UNLOCK_LOCKED_WEEKS);
  return `${done} of ${PROGRAM_UNLOCK_LOCKED_WEEKS} weeks locked`;
}

/** True while `now` is inside the 3-day window that starts at the later of the
 * unlock moment and `PROGRAM_BANNER_SINCE`. */
export function programBannerWindowOpen(unlockedAtMs: number, now = Date.now()): boolean {
  const start = Math.max(unlockedAtMs, new Date(PROGRAM_BANNER_SINCE).getTime());
  return now < start + PROGRAM_BANNER_DAYS * 24 * 60 * 60 * 1000;
}
