import { NextRequest, NextResponse } from 'next/server';
import { AuthError, getCurrentUser, requireAdmin } from '@/lib/auth';
import {
  athletePerformanceWithSnapshot,
  householdAthletePerformance,
  normalizePerformancePeriod,
  type PerformancePeriod,
} from '@/lib/athletePerformance';
import { athleteCardioSeconds } from '@/lib/optionals';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const period: PerformancePeriod = normalizePerformancePeriod(
      request.nextUrl.searchParams.get('period')
    );

    if (request.nextUrl.searchParams.get('household') === '1') {
      await requireAdmin();
      const includeTest = request.nextUrl.searchParams.get('includeTest') === '1';
      const rows = await householdAthletePerformance(period, { includeTest });
      return NextResponse.json({ hidden: false, period, rows });
    }

    // Only the opt-in tracks are accepted — an unrecognized value falls back to the
    // athlete's whole (untracked) history rather than silently filtering to nothing.
    const trackParam = request.nextUrl.searchParams.get('track');
    const track = trackParam === 'hyrox' || trackParam === 'overload' ? trackParam : undefined;

    const [board, cardioSeconds] = await Promise.all([
      athletePerformanceWithSnapshot(user.id, user.callName, period, track, user.householdId),
      athleteCardioSeconds(user.id, period),
    ]);
    return NextResponse.json({ hidden: false, ...board, cardioSeconds });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error getting athlete performance:', error);
    return NextResponse.json({ error: 'Failed to get athlete performance' }, { status: 500 });
  }
}
