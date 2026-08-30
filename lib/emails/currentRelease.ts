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
  version: '5.5.0',
  title: 'Do not leave the hour open.',
  subject: 'Do not leave the hour open.',
  signer: 'Master Tom Iron',
  tone: 'master',
  intro:
    'An open session is not a rest, man. It is you walking out on work I still own. I will say it once. I do not repeat myself for quit.',
  mid: 'I have more to say under the bar. You do not get to pick the line. You lift.',
  close: 'Hard-refresh. If a session is still open, come back. Then stay until I dismiss you.',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Kevin'],
  lead: '',
  groups: [
    {
      heading: 'Left open',
      wins: [
        'Home — Pick back up. I tell you that you are late.',
        'Resume — same line when you walk back in.',
        'Mail — if the hour is still open, I send it. Late again and you stay out of the house.',
      ],
    },
    {
      heading: 'Under the bar',
      wins: [
        'Start / middle / finish — more of my voice in the session.',
        'How hard 5 — DO YOU GIVE? You must give.',
      ],
    },
  ],
  wins: [],
  also: [],
};
