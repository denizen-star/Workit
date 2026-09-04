import { NextResponse } from 'next/server';
import { getCurrentUser, isAdminUser } from '@/lib/auth';
import { loadCoachCatalogFromDb } from '@/lib/coachCatalogDb';
import { pickMissedWeekLine, pickWeekPlaceLine } from '@/lib/coachLines';
import { isTestUserName } from '@/lib/householdUsers';
import {
  countUserClosedWeekWorkouts,
  ensureClosedWeekPodiums,
  lastClosedMonday,
  loadUserWeekMedals,
  loadWeekMedalCounts,
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
    const you: (WeekPodiumYou & { line: string }) | null = placed
      ? {
          weekMonday: placed.weekMonday,
          place: placed.place,
          line: pickWeekPlaceLine(placed.place, user.coachTone, user.name),
        }
      : null;

    let miss: WeekMissYou | null = null;
    if (weekMonday && !you && !isTestUserName(user.name)) {
      const workouts = await countUserClosedWeekWorkouts(user.id, weekMonday);
      if (missedTheWeek(workouts)) {
        miss = {
          weekMonday,
          workouts,
          line: pickMissedWeekLine(user.name, user.coachTone),
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
