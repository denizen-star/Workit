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
  version: '7.13.0',
  title: 'Starting fresh gets its own hello now.',
  subject: 'Starting fresh gets its own hello now.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Kevin'],
  includeNewAthletes: false,
  intro:
    "Man, starting a brand new session used to feel the same as walking back into one you left open. Not anymore. Start fresh now and I say something different, right up front.",
  mid: "Five different lines from me alone, picked at random so it never feels canned. Grey, Luna, and Eli each got their own five too. Quit sounds the same every time it shows up. This does not.",
  close: "Small change. Still growth. See you on the floor, man.",
  lead: '',
  groups: [
    {
      heading: 'New session',
      wins: [
        'Starting a brand-new workout now gets its own quick hello from your coach.',
        'It reads differently than the message you get when you resume one already open.',
      ],
    },
  ],
  wins: [],
  also: [],
};
