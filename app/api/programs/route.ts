import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { moreProgramsStatus } from '@/lib/programStatus';

/** Both More programs in one call: `{ lockedWeeks, hyrox, overload }` (lib/programStatus.ts).
 * Starting, leaving and the other actions stay on POST /api/hyrox and /api/overload. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json(await moreProgramsStatus(user));
}
