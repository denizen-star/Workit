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
  version: '7.1.0',
  title: 'The clock does not cut you off anymore.',
  subject: 'The clock does not cut you off anymore.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: false,
  includeNewAthletes: false,
  intro:
    'The Optional clock used to cut you off at ten minutes, man. Run, bike, done, whether you wanted more or not. Not anymore. Ten minutes is the floor, not the ceiling.',
  mid: 'Keep the run or the bike going as long as you have it in you. The clock counts up past ten. You tap Done when you are done, not before. And every minute you put in now shows — Your performance keeps your total time running and cycling, and the house sees it too. Nothing to hide when you show up. The profile photo is easier to set as well: a bigger circle, drag it to where you want it, done.',
  close: 'Hard-refresh. Open a session. Run it as long as you have it, then tap Done. Quit is not on that clock.',
  lead: '',
  groups: [
    {
      heading: 'Optional cardio',
      wins: [
        'Run and Bike no longer stop at ten minutes. Keep going.',
        'Tap Done whenever you are finished.',
        'Total time running and cycling now shows on Your performance.',
        'The house also shows a running and cycling honor roll.',
      ],
    },
    {
      heading: 'Profile photo',
      wins: [
        'Bigger circle to work with.',
        'Drag it to recenter — no separate button needed.',
        'Zoom slider sits below, full width.',
      ],
    },
  ],
  wins: [],
  also: [],
};
