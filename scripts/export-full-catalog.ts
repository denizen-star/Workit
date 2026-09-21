/** Dumps lib/movementLibrary.ts's computed catalog as JSON — used to regenerate
 * docs/full_program.csv and for ad-hoc inspection. The catalog itself now lives in
 * lib/movementLibrary.ts (also used by app/library/page.tsx), not duplicated here. */
import { MOVEMENT_LIBRARY } from '@/lib/movementLibrary';

const missingImages = MOVEMENT_LIBRARY.filter((r) => !r.start);
process.stderr.write(`total: ${MOVEMENT_LIBRARY.length}, missing images: ${missingImages.length}\n`);
if (missingImages.length) {
  process.stderr.write(missingImages.map((r) => `  MISSING: ${r.name}`).join('\n') + '\n');
}
process.stdout.write(JSON.stringify(MOVEMENT_LIBRARY, null, 2));
