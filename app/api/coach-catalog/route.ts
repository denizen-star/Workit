import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCoachVoices, getLinePack, packIsUsable } from '@/lib/coachCatalog';
import { loadCoachCatalogFromDb } from '@/lib/coachCatalogDb';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await loadCoachCatalogFromDb();
    const master = getLinePack('master');
    const luna = getLinePack('luna');
    const james = getLinePack('james');

    return NextResponse.json({
      voices: getCoachVoices(),
      packs:
        packIsUsable(master) && packIsUsable(luna)
          ? {
              master,
              luna,
              ...(packIsUsable(james) ? { james } : {}),
            }
          : undefined,
    });
  } catch (error) {
    console.error('Error getting coach catalog:', error);
    return NextResponse.json({ error: 'Failed to get coach catalog' }, { status: 500 });
  }
}
