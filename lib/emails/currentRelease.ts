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
  version: '5.2.2',
  title: 'Your belt colors the hour',
  subject: 'The session takes your belt color.',
  signer: 'Master Tom Iron',
  tone: 'master',
  intro: 'Look at the floor when you start. The color is yours. I do not paint it for quit.',
  mid: 'That tint is the belt you earned, man. Stay in it.',
  close: 'Hard-refresh. Start the session. Then get under the bar.',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: [],
  lead: '',
  groups: [
    {
      heading: 'The session',
      wins: [
        'Live log — the page, the header, and the cards take your belt color.',
        'Which belt — the one you hold. If you have none yet, the one you are filling.',
        'Home and Select — stay the dark page. The wash is the session only.',
      ],
    },
    {
      heading: 'The belts',
      wins: [
        '2 weeks — Dipping your toes. Cream.',
        '6 weeks — Got back in the saddle. Mint.',
        '10 weeks — I see you getting stronger. Earth green.',
        '20 weeks — Steady. Pale gold.',
        '24 weeks — Weigh-up sprint. Copper.',
        '48 weeks — Arnold Status. Near black.',
      ],
    },
  ],
  wins: [],
  also: [],
};
