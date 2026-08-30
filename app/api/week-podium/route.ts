import { NextResponse } from 'next/server';
import { getCurrentUser, isAdminUser } from '@/lib/auth';
import { loadCoachCatalogFromDb } from '@/lib/coachCatalogDb';
import { pickWeekPlaceLine } from '@/lib/coachLines';
import { isTestUserName } from '@/lib/householdUsers';
import {
  ensureClosedWeekPodiums,
  lastClosedMonday,
  loadUserWeekMedals,
  loadWeekMedalCounts,
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
          line: pickWeekPlaceLine(placed.place, user.coachTone),
        }
      : null;

    return NextResponse.json({
      weekMonday,
      you,
      history,
      ...(isAdminUser(user) ? { counts: await loadWeekMedalCounts() } : {}),
    });
  } catch (error) {
    console.error('Error getting week podium:', error);
    return NextResponse.json({ error: 'Failed to get week podium' }, { status: 500 });
  }
}
