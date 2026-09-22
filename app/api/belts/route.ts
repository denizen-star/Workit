import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { householdBeltRows } from '@/lib/beltHousehold';
import { progressFor } from '@/lib/belts';
import { lockedWeekCountFromTable } from '@/lib/lockedWeeks';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const [lockedWeeks, household] = await Promise.all([
      lockedWeekCountFromTable(user.id),
      householdBeltRows(user.householdId),
    ]);

    return NextResponse.json({
      ...progressFor(lockedWeeks, user.coachTone, user.callName, user.gender),
      household,
    });
  } catch (error) {
    console.error('Error getting belts:', error);
    return NextResponse.json({ error: 'Failed to get belts' }, { status: 500 });
  }
}
