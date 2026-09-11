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
  type WeekTakeoverKind,
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
    const you: (WeekPodiumYou & { line: string; seen: boolean }) | null = placed
      ? {
          weekMonday: placed.weekMonday,
          place: placed.place,
          line: pickWeekPlaceLine(placed.place, user.coachTone, user.callName),
          seen: await hasSeenWeekTakeover(user.id, placed.weekMonday, 'podium'),
        }
      : null;

    let miss: (WeekMissYou & { seen: boolean }) | null = null;
    if (
      weekMonday &&
      !you &&
      !isTestUserName(user.name) &&
      accountExistedBeforeWeek(user.createdAt, weekMonday)
    ) {
      const workouts = await countUserClosedWeekWorkouts(user.id, weekMonday);
      if (missedTheWeek(workouts)) {
        miss = {
          weekMonday,
          workouts,
          line: pickMissedWeekLine(user.name, user.coachTone),
          seen: await hasSeenWeekTakeover(user.id, weekMonday, 'miss'),
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

/** Mark the podium or miss takeover dismissed for this user + week, so it doesn't show again on any device. */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const weekMonday = typeof body?.weekMonday === 'string' ? body.weekMonday : null;
    const kind: WeekTakeoverKind = body?.kind === 'miss' ? 'miss' : 'podium';
    if (!weekMonday) {
      return NextResponse.json({ error: 'weekMonday required' }, { status: 400 });
    }

    await markWeekTakeoverSeen(user.id, weekMonday, kind);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error marking week takeover seen:', error);
    return NextResponse.json({ error: 'Failed to mark week takeover seen' }, { status: 500 });
  }
}
