import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  athletePerformance,
  isPerformancePeriod,
  type PerformancePeriod,
} from '@/lib/athletePerformance';
import { isTestUserName } from '@/lib/householdUsers';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (isTestUserName(user.name)) {
      return NextResponse.json({ hidden: true, summary: null, exercises: [], workouts: [] });
    }

    const requested = request.nextUrl.searchParams.get('period') || '15';
    const period: PerformancePeriod = isPerformancePeriod(requested) ? requested : '15';
    const board = await athletePerformance(user.id, period);
    return NextResponse.json({ hidden: false, ...board });
  } catch (error) {
    console.error('Error getting athlete performance:', error);
    return NextResponse.json({ error: 'Failed to get athlete performance' }, { status: 500 });
  }
}
