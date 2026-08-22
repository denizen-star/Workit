import { NextRequest, NextResponse } from 'next/server';
import { AuthError, requireAdmin } from '@/lib/auth';
import { fetchAdminAnalytics } from '@/lib/adminAnalytics';
import { parseDevice, parseGeo, parseRange } from '@/lib/analyticsTime';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const sp = request.nextUrl.searchParams;
    const personRaw = sp.get('userId');
    const personUserId =
      personRaw && personRaw !== 'unsigned' && Number.isFinite(Number(personRaw))
        ? Number(personRaw)
        : null;

    const payload = await fetchAdminAnalytics({
      range: parseRange(sp.get('range')),
      device: parseDevice(sp.get('device')),
      geo: parseGeo(sp),
      personUserId,
    });
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[admin/analytics] failed:', error);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
