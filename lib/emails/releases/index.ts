import type { ReleaseDef } from '@/lib/emails/currentRelease';
import { MAP_YOUR_JOURNEY_V14_1 } from '@/lib/emails/releases/mapYourJourneyV14_1';
import { TRAINING_FOCUS_V14 } from '@/lib/emails/releases/trainingFocusV14';

/**
 * Release notes you can send by name: `npm run mail:release -- --release=<name>`.
 * Add an entry when a release's email should stay callable after the next release
 * rewrites lib/emails/currentRelease.ts.
 */
export const NAMED_RELEASES: Record<string, ReleaseDef> = {
  'training-focus-v14': TRAINING_FOCUS_V14,
  'map-your-journey-v14-1': MAP_YOUR_JOURNEY_V14_1,
};
