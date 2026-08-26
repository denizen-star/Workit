import { NextRequest, NextResponse } from 'next/server';
import { AuthError, getCurrentUser, requireAdmin } from '@/lib/auth';
import {
  athletePerformance,
  householdAthletePerformance,
  isPerformancePeriod,
  type PerformancePeriod,
} from '@/lib/athletePerformance';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const requested = request.nextUrl.searchParams.get('period') || '15';
    const period: PerformancePeriod = isPerformancePeriod(requested) ? requested : '15';

    if (request.nextUrl.searchParams.get('household') === '1') {
      await requireAdmin();
      const rows = await householdAthletePerformance(period);
      return NextResponse.json({ hidden: false, period, rows });
    }

    const board = await athletePerformance(user.id, period);
    return NextResponse.json({ hidden: false, ...board });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error getting athlete performance:', error);
    return NextResponse.json({ error: 'Failed to get athlete performance' }, { status: 500 });
  }
}
