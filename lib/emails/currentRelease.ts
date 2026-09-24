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
  /** Luna's letter when this release has its own words. Otherwise she gets the shared copy. */
  luna?: ReleaseCopy;
  wins: string[];
  also: string[];
} = {
  version: '9.1.2',
  title: 'The mail has the house name.',
  subject: 'The mail comes from workitapp.fit.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Kevin'],
  includeNewAthletes: false,
  intro:
    'The letters from this house were leaving under another name. That stops. You will see workitapp.fit on them. That is the house.',
  mid: 'Your coach writes from his own address. Tom, Grey, Luna, Eli. A welcome, an invite, and the check on your email come from welcome. A new PIN comes from help. These notes, the six-week pace check, and a reply about a feature you asked for come from news. The man who opens them should know who sent them.',
  close:
    'Open them. The growth is still in the work. Quit is the only thing that does not get a letter.',
  lead: '',
  groups: [
    {
      heading: 'Who writes',
      wins: [
        'Your coach — tom@, grey@, luna@, or eli@ at workitapp.fit. That is the nudge, the recap, a badge, and a belt.',
        'Welcome — a welcome, an invite, and the email check.',
        'Help — a new PIN.',
        'News — these notes, the six-week pace check, and a reply about a feature you asked for.',
      ],
    },
  ],
  wins: [],
  also: [],
};
