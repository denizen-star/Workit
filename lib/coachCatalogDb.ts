import { catalogFromRows, hydrateCoachCatalog, packIsUsable } from '@/lib/coachCatalog';
import { query } from '@/lib/db';

let loaded = false;
let loading: Promise<void> | null = null;

export async function loadCoachCatalogFromDb() {
  if (loaded) return;
  if (loading) return loading;

  loading = (async () => {
    try {
      const voices = await query(
        `SELECT id, display_name, description, blurb, from_name
         FROM coach_voices
         WHERE is_active = 1
         ORDER BY id ASC`
      );
      const lines = await query(
        `SELECT voice_id, bucket, title, body, sort_order
         FROM coach_lines
         WHERE is_active = 1
         ORDER BY voice_id ASC, bucket ASC, sort_order ASC, id ASC`
      );
      const catalog = catalogFromRows(
        voices.rows as Array<{
          id: string;
          display_name: string;
          description: string;
          blurb: string;
          from_name: string;
        }>,
        lines.rows as Array<{
          voice_id: string;
          bucket: string;
          title: string | null;
          body: string;
          sort_order: number;
        }>
      );
      if (catalog.voices.length && packIsUsable(catalog.packs.master) && packIsUsable(catalog.packs.sergeant)) {
        hydrateCoachCatalog(catalog);
        loaded = true;
      }
    } catch (error) {
      console.warn('[coach-catalog] using code fallback', error);
    } finally {
      loading = null;
    }
  })();

  return loading;
}
