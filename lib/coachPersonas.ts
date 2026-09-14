import type { CoachTone } from '@/lib/coachTone';

/** The six coach portrait moods. Assets live in `public/personas/{tone}-{expression}[-N].png`. */
export type CoachExpression = 'welcome' | 'close' | 'happy' | 'ok' | 'mad' | 'celebratory';

/** How many photo variants exist per coach/expression, e.g. `james-happy.png` + `james-happy-2.png` = 2. */
const VARIANT_COUNTS: Record<CoachTone, Record<CoachExpression, number>> = {
  master: { welcome: 1, close: 1, happy: 1, ok: 2, mad: 2, celebratory: 1 },
  james: { welcome: 1, close: 1, happy: 2, ok: 2, mad: 2, celebratory: 1 },
  luna: { welcome: 1, close: 1, happy: 2, ok: 2, mad: 2, celebratory: 1 },
  eli: { welcome: 1, close: 1, happy: 3, ok: 2, mad: 2, celebratory: 1 },
};

/** Public path (root-relative, works for both `<img>` and email `<img>` once prefixed with `appUrl()`) for one coach persona photo. Picks a random variant when more than one exists. */
export function coachPersonaSrc(tone: CoachTone, expression: CoachExpression): string {
  const count = VARIANT_COUNTS[tone][expression];
  const variant = count > 1 ? Math.floor(Math.random() * count) + 1 : 1;
  const suffix = variant > 1 ? `-${variant}` : '';
  return `/personas/${tone}-${expression}${suffix}.png`;
}
