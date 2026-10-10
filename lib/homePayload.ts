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

/** The top of Home — enough to paint the hero, Start and Week lock: profile, sessions,
 * coach lines and More programs. `locked_weeks` is read once and shared, in flight,
 * so no part waits for it before starting. */
async function homeTop(user: SessionUser) {
  const lockedRecords = lockedWeekRecords(user.id);
  const [sessions, catalog, programs] = await Promise.all([
    orNull(sessionsPayload(user, { home: true, lockedRecords }), 'sessions'),
    orNull(coachCatalogPayload(), 'coach catalog'),
    orNull(moreProgramsStatus(user, lockedRecords), 'programs'),
  ]);
  // The session rows already say how many workouts are finished.
  const completed = sessions?.sessions.filter((row) => Number(row.is_completed)).length;
  const me = await mePayload(user, completed);
  return { me, sessions, catalog, programs };
}

/** The rest of Home, which fills in after the first paint: stats (Daily weight, house
 * average), last week's podium and the performance board. */
async function homeRest(user: SessionUser) {
  const [stats, podium, board] = await Promise.all([
    orNull(statsPayload(user, { home: true, excludeSession: 0 }), 'stats'),
    orNull(weekPodiumPayload(user), 'week podium'),
    orNull(homeBoardPayload(user), 'performance board'),
  ]);
  return { stats, podium, board };
}

export type HomePart = 'top' | 'rest';

/**
 * Home on open (GET /api/home): `part=top` paints the page, `part=rest` fills in the
 * slower parts — Home fires both at once, so first paint never waits on stats or the
 * board. No `part` returns both (one call). Each part has its own route's shape; a part
 * that failed is null. The hold line stays its own call (it depends on today's target).
 */
export async function homePayload(part?: HomePart) {
  const user = await getCurrentUserOrBlocked();
  if (user === 'blocked' || !user) return user;
  if (part === 'top') return homeTop(user);
  if (part === 'rest') return homeRest(user);
  const [top, rest] = await Promise.all([homeTop(user), homeRest(user)]);
  return { ...top, ...rest };
}
