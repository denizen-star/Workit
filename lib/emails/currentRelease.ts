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
  version: '8.4.0',
  title: 'Your coach speaks.',
  subject: 'Your coach speaks.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Kevin'],
  includeNewAthletes: false,
  intro:
    'The coach was words on a screen. Now the man in the session hears him.',
  mid: 'Welcome, the rest between sets, a new record, and how hard the work felt — those lines are spoken. Your name stays on the screen. Coach voices in Edit profile shuts the speech off, and the chimes stay.',
  close: 'Hear it. Then earn the next one. Quit is still the only thing not welcome in here.',
  lead: '',
  groups: [
    {
      heading: 'Added',
      wins: [
        'Coach voices — the live lines are spoken. Welcome, resume, the rest call, a new record, better or worse than last time, and how hard the exercise felt. Turn the speech off in Edit profile. A line with no recording stays text.',
      ],
    },
    {
      heading: 'Changed',
      wins: [
        'House menu — more than one house switches from a dropdown in the menu.',
        'Finish calls — a new record, a better-or-worse call, and the effort call show one after another.',
      ],
    },
  ],
  wins: [],
  also: [],
};
