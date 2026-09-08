/**
 * User-facing release notes. `/document` rewrites this from CHANGELOG Unreleased,
 * then runs `npm run mail:release`. Household tone only — no Netlify, env vars, or admin tooling.
 */
import type { CoachTone } from '@/lib/coachTone';

export type ReleaseGroup = {
  heading: string;
  wins: string[];
};

export type ReleaseCopy = {
  intro?: string;
  mid?: string;
  close?: string;
  groups?: ReleaseGroup[];
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
  includeNewAthletes?: boolean;
  lead?: string;
  intro?: string;
  mid?: string;
  close?: string;
  groups: ReleaseGroup[];
  /** Extra / replacement copy for Kevin only. Athletes never see this. */
  kevin?: ReleaseCopy;
  wins: string[];
  also: string[];
} = {
  version: '7.4.0',
  title: 'The house calls you the right name now.',
  subject: 'The house calls you the right name now.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Kevin'],
  includeNewAthletes: false,
  intro: 'Man, cleaned up a few things this week. Nothing you asked for out loud. You will still feel it.',
  mid: 'The house and You vs now call other people by the name they picked for themselves, not the name on their license. You always see your own real name. New people stop getting scolded for a week that closed before they even joined, and a missing photo shows an initial instead of a broken square.',
  close: 'Also fixed the icon on your home screen if you saved this app there — it went back to looking like Work-It instead of a plain letter. Nothing for you to do, man. Just open it.',
  lead: '',
  groups: [
    {
      heading: 'The house and You vs',
      wins: [
        'Other athletes show by the name they picked, not their full name.',
        'You always see your own real name.',
      ],
    },
    {
      heading: 'New people',
      wins: [
        'No more false "you missed last week" message on day one.',
        'A missing photo shows your initial instead of a broken image.',
      ],
    },
    {
      heading: 'How to use',
      wins: ['Rebuilt as numbered steps with pictures, not a plain list.'],
    },
    {
      heading: 'Home screen icon',
      wins: ['Fixed — shows the Work-It logo again, not a plain letter.'],
    },
  ],
  wins: [],
  also: [],
};
