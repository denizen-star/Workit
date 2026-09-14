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
  version: '7.15.0',
  title: 'Every doubt, answered.',
  subject: 'Every doubt, answered.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    "Man, doubt is quiet. It sits in the back of your head and asks if this whole thing is worth the trouble. I do not like leaving it there unanswered.",
  mid: "So it has an answer now. Straight, no dodge: why the sets fill themselves in, why you are not crossing the floor for equipment, why none of this costs you a cent. Quit needs a reason to stick around. I took it away.",
  close: "Read it once, man. Then get back to work.",
  lead: '',
  groups: [
    {
      heading: 'Added',
      wins: [
        'A new Why Work-It page — nine straight answers on why the app logs itself, keeps you off crowded equipment, and never nickel-and-dimes your training. Find it from Join, Login, Help, or the menu',
      ],
    },
  ],
  wins: [],
  also: [],
};
