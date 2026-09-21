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
  version: '7.19.0',
  title: 'One day is still a day.',
  subject: 'One day is still a day.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Kevin'],
  includeNewAthletes: false,
  intro:
    'Man, two days a week was already thin. For some of you even that was too many to find. That excuse is gone too now.',
  mid: 'One day a week is on the table. Set it in Edit profile and the whole week folds into a single full-body session — no split, nothing skipped. Change your mind later and nothing you already locked gets touched.',
  close: 'One day is still a day. Show up for it. Quit does not get to hide behind a schedule that never fit.',
  lead: '',
  groups: [
    {
      heading: 'Changed',
      wins: [
        'Training days — goes as low as 1 a week now, not 2. One day, one full-body session, everything covered',
      ],
    },
  ],
  wins: [],
  also: [],
};
