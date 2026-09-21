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
  version: '8.1.1',
  title: 'Alt extras are back on the card.',
  subject: 'Alt extras are back on the card.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Kevin'],
  includeNewAthletes: false,
  intro:
    'Man, you swapped the lift and the extra-set work went quiet. That was a miss. It is not quiet now.',
  mid: 'Alt still holds for the day. Add a set, take one off — the card still knows it is your work, swapped name and all.',
  close: 'Growth does not care which name is on the bar. Log the work. Quit is still the only thing not welcome in here.',
  lead: '',
  groups: [
    {
      heading: 'Fixed',
      wins: [
        'Alt Exercise — extra sets add and remove after a swap, the way they should',
      ],
    },
  ],
  wins: [],
  also: [],
};
