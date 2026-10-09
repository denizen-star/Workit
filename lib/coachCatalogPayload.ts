import { getCoachVoices, getLinePack, packIsUsable } from '@/lib/coachCatalog';
import { loadCoachCatalogFromDb } from '@/lib/coachCatalogDb';

/** Coach voices + line packs the client hydrates (GET /api/coach-catalog, and Home's
 * part of GET /api/home). */
export async function coachCatalogPayload() {
  await loadCoachCatalogFromDb();
  const master = getLinePack('master');
  const luna = getLinePack('luna');
  const james = getLinePack('james');

  return {
    voices: getCoachVoices(),
    packs:
      packIsUsable(master) && packIsUsable(luna)
        ? {
            master,
            luna,
            ...(packIsUsable(james) ? { james } : {}),
          }
        : undefined,
  };
}
