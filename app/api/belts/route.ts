import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { householdBeltRows } from '@/lib/beltHousehold';
import { lockedWeekCount, progressFor } from '@/lib/belts';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const [mine, household] = await Promise.all([
      query(
        'SELECT week_number, is_completed FROM workout_sessions WHERE user_id = ?',
        [user.id]
      ),
      householdBeltRows(),
    ]);

    return NextResponse.json({
      ...progressFor(
        lockedWeekCount(mine.rows as Array<{ week_number: number; is_completed: unknown }>),
        user.coachTone,
        user.name
      ),
      household,
    });
  } catch (error) {
    console.error('Error getting belts:', error);
    return NextResponse.json({ error: 'Failed to get belts' }, { status: 500 });
  }
}
