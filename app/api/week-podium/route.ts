import { NextResponse } from 'next/server';
import { getCurrentUser, isAdminUser } from '@/lib/auth';
import { loadCoachCatalogFromDb } from '@/lib/coachCatalogDb';
import { pickMissedWeekLine, pickWeekPlaceLine } from '@/lib/coachLines';
import { isTestUserName } from '@/lib/householdUsers';
import {
  accountExistedBeforeWeek,
  countUserClosedWeekWorkouts,
  ensureClosedWeekPodiums,
  hasSeenWeekTakeover,
  lastClosedMonday,
  loadUserWeekMedals,
  loadWeekMedalCounts,
  markWeekTakeoverSeen,
  missedTheWeek,
  type WeekMissYou,
  type WeekPodiumYou,
} from '@/lib/weekPodium';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await loadCoachCatalogFromDb();
    await ensureClosedWeekPodiums();

    const weekMonday = lastClosedMonday();
    const history = await loadUserWeekMedals(user.id, user.name);
    const placed =
      weekMonday && !isTestUserName(user.name)
        ? history.find((row) => row.weekMonday === weekMonday)
        : undefined;

    // "seen" is decided (and marked) right here at delivery time, not on client dismiss — a fire-and-forget
    // fetch from onClose can get cancelled by a tab close / PWA backgrounding / navigation before it lands,
    // which is exactly why this used to keep reappearing. Marking on GET means it only ever gets sent once.
    let you: (WeekPodiumYou & { line: string; seen: boolean }) | null = null;
    if (placed) {
      const alreadySeen = await hasSeenWeekTakeover(user.id, placed.weekMonday, 'podium');
      if (!alreadySeen) await markWeekTakeoverSeen(user.id, placed.weekMonday, 'podium');
      you = {
        weekMonday: placed.weekMonday,
        place: placed.place,
        line: pickWeekPlaceLine(placed.place, user.coachTone, user.callName),
        seen: alreadySeen,
      };
    }

    let miss: (WeekMissYou & { seen: boolean }) | null = null;
    if (
      weekMonday &&
      !you &&
      !isTestUserName(user.name) &&
      accountExistedBeforeWeek(user.createdAt, weekMonday)
    ) {
      const workouts = await countUserClosedWeekWorkouts(user.id, weekMonday);
      if (missedTheWeek(workouts)) {
        const alreadySeen = await hasSeenWeekTakeover(user.id, weekMonday, 'miss');
        if (!alreadySeen) await markWeekTakeoverSeen(user.id, weekMonday, 'miss');
        miss = {
          weekMonday,
          workouts,
          line: pickMissedWeekLine(user.name, user.coachTone),
          seen: alreadySeen,
        };
      }
    }

    return NextResponse.json({
      weekMonday,
      you,
      miss,
      history,
      ...(isAdminUser(user) ? { counts: await loadWeekMedalCounts() } : {}),
    });
  } catch (error) {
    console.error('Error getting week podium:', error);
    return NextResponse.json({ error: 'Failed to get week podium' }, { status: 500 });
  }
}
