import { getCurrentUserOrBlocked, type SessionUser } from '@/lib/auth';
import { athletePerformanceWithSnapshot } from '@/lib/athletePerformance';
import { coachCatalogPayload } from '@/lib/coachCatalogPayload';
import { lockedWeekRecords } from '@/lib/lockedWeeks';
import { mePayload } from '@/lib/mePayload';
import { athleteCardioSeconds } from '@/lib/optionals';
import { moreProgramsStatus } from '@/lib/programStatus';
import { sessionsPayload } from '@/lib/sessionsPayload';
import { statsPayload } from '@/lib/statsPayload';
import { weekPodiumPayload } from '@/lib/weekPodiumPayload';

/** One part of Home that failed reads as null, so the rest of Home still paints. */
function orNull<T>(part: Promise<T>, label: string): Promise<T | null> {
  return part.catch((error) => {
    console.error(`Error loading home ${label}:`, error);
    return null;
  });
}

/** The board behind Home's Today numbers, Week lock / performance and Session stories:
 * the last 15 Eastern days, or all time when those 15 days are empty (same rule the
 * client used, `loadHomeBoard` in components/HomeKpiLead.tsx). */
async function homeBoardPayload(user: SessionUser) {
  const board = async (period: 't-15' | 'all') => {
    const [perf, cardioSeconds] = await Promise.all([
      athletePerformanceWithSnapshot(user.id, user.callName, period, undefined, user.householdId),
      athleteCardioSeconds(user.id, period),
    ]);
    return { hidden: false, ...perf, cardioSeconds };
  };
  const recent = await board('t-15');
  return recent.exercises?.length || recent.window?.setCount ? recent : board('all');
}

/**
 * Everything Home shows on open, in one call (GET /api/home): profile, sessions, coach
 * lines, More programs, stats, last week's podium and the performance board. Signs in
 * once and reads `locked_weeks` once for every part. Each part has the same shape its
 * own route returns. The hold line stays its own call (it depends on today's target).
 */
export async function homePayload() {
  const user = await getCurrentUserOrBlocked();
  if (user === 'blocked' || !user) return user;

  const lockedRecords = await lockedWeekRecords(user.id);
  const [sessions, catalog, programs, stats, podium, board] = await Promise.all([
    orNull(sessionsPayload(user, { home: true, lockedRecords }), 'sessions'),
    orNull(coachCatalogPayload(), 'coach catalog'),
    orNull(moreProgramsStatus(user, lockedRecords), 'programs'),
    orNull(
      statsPayload(user, { home: true, excludeSession: 0, lockedWeeks: lockedRecords.map((row) => row.weekNumber) }),
      'stats'
    ),
    orNull(weekPodiumPayload(user), 'week podium'),
    orNull(homeBoardPayload(user), 'performance board'),
  ]);
  // The session rows already say how many workouts are finished.
  const completed = sessions?.sessions.filter((row) => Number(row.is_completed)).length;
  const me = await mePayload(user, completed);
  return { me, sessions, catalog, programs, stats, podium, board };
}
