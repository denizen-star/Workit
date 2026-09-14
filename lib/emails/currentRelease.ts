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
  version: '7.13.1',
  title: 'The hello actually shows up now.',
  subject: 'The hello actually shows up now.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Kevin'],
  includeNewAthletes: false,
  intro:
    "Man, I owe you a word. That hello I promised last time, resuming a session, starting a fresh one, it was not showing up. A timing bug killed it before you ever saw it.",
  mid: "Fixed. Quit does not get a second chance to hide something broken. Neither do I.",
  close: "Should be on the floor waiting for you now. See you there, man.",
  lead: '',
  groups: [
    {
      heading: 'Fixed',
      wins: [
        "The coach welcome message now actually appears, whether you're resuming a session or starting a new one.",
      ],
    },
  ],
  wins: [],
  also: [],
};
