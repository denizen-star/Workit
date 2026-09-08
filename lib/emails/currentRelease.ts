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
  version: '7.2.4',
  title: 'You will see my name different now.',
  subject: 'You will see my name different now.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: false,
  includeNewAthletes: false,
  intro:
    'Small thing, man. Nothing about the work changed. Just my name in your inbox.',
  mid: 'Mail from me now shows up as "Workit - Coach Tom" instead of just my name. Same voice, same standards, same account. James Grey and Luna Meadows get the same treatment for their people. You will still know it is me the second you open it.',
  close: 'Nothing to do here. Just do not delete it thinking it is spam.',
  lead: '',
  groups: [
    {
      heading: 'Your inbox',
      wins: ['Mail now arrives from "Workit - Coach Tom" (or James / Luna for their people).'],
    },
  ],
  wins: [],
  also: [],
};
