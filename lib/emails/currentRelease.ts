/**
 * User-facing release notes. `/document` rewrites this from CHANGELOG Unreleased,
 * then runs `npm run mail:release`. Household tone only — no Netlify, env vars, or admin tooling.
 */
import type { CoachTone } from '@/lib/coachTone';

export type ReleaseGroup = {
  heading: string;
  wins: string[];
};

export const CURRENT_RELEASE: {
  version: string;
  title: string;
  subject?: string;
  signer?: string;
  tone?: CoachTone;
  onlyAthletesWithWorkouts?: boolean;
  activeInDays?: number;
  onlyAthletes?: string[];
  lead?: string;
  intro?: string;
  mid?: string;
  close?: string;
  groups: ReleaseGroup[];
  wins: string[];
  also: string[];
} = {
  version: '5.4.0',
  title: 'The week has metal.',
  subject: 'The week has metal.',
  signer: 'Master Tom Iron',
  tone: 'master',
  intro:
    'The week has a top now. Days first. Then iron. I mark 1st, 2nd, 3rd. You will know if you placed, man.',
  mid: 'Sunday ends the week. Monday I tell the ones who placed. The rest get silence. Hunt.',
  close: 'Hard-refresh. Open Home. If you earned metal, take it. Then get under the bar.',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: [],
  lead: '',
  groups: [
    {
      heading: 'The week',
      wins: [
        'After Sunday — that Mon–Sun week locks. Same score as The house. Days, then total lb.',
        'Monday — first open, a shout if you are 1st, 2nd, or 3rd. Gold. Silver. Bronze.',
        'Home — your disc sits on Start if you placed. No place, no mark.',
        'Medals — Last weeks keeps every place you earned.',
      ],
    },
  ],
  wins: [],
  also: [],
};
