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
import { clampScheduleDays } from '@/lib/scheduleDays';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Rows are filled first; the catalog loads alongside, and the medal reads follow.
    const filled = ensureClosedWeekPodiums();
    const [, history, counts] = await Promise.all([
      loadCoachCatalogFromDb(),
      filled.then(() => loadUserWeekMedals(user.id, user.name)),
      isAdminUser(user) ? filled.then(() => loadWeekMedalCounts()) : null,
    ]);

    const weekMonday = lastClosedMonday();
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
      const [workouts, missSeen] = await Promise.all([
        countUserClosedWeekWorkouts(user.id, weekMonday),
        hasSeenWeekTakeover(user.id, weekMonday, 'miss'),
      ]);
      // The exact program week that calendar week is not tracked historically, so this
      // uses the athlete's current chosen count directly rather than looking up a
      // specific week's bonus-day availability (only weeks 1-2 would differ, and by
      // the time a week has closed an athlete is almost never still there).
      if (missedTheWeek(workouts, clampScheduleDays(user.scheduleDaysPerWeek))) {
        if (!missSeen) await markWeekTakeoverSeen(user.id, weekMonday, 'miss');
        miss = {
          weekMonday,
          workouts,
          line: pickMissedWeekLine(user.name, user.coachTone),
          seen: missSeen,
        };
      }
    }

    return NextResponse.json({
      weekMonday,
      you,
      miss,
      history,
      ...(counts ? { counts } : {}),
    });
  } catch (error) {
    console.error('Error getting week podium:', error);
    return NextResponse.json({ error: 'Failed to get week podium' }, { status: 500 });
  }
}
