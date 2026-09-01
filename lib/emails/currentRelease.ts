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
  version: '5.6.0',
  title: 'Read the board from the top.',
  subject: 'Read the board from the top.',
  signer: 'Master Tom Iron',
  tone: 'master',
  intro:
    'Your performance is in order now, man. You vs last time first. Then the rest. I do not repeat myself for quit.',
  mid: 'The days sit on the pills. Today is T. You start there.',
  close: 'Hard-refresh. Open Your performance. Start at the top. Stay until you have read it.',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  lead: '',
  groups: [
    {
      heading: 'Your performance',
      wins: [
        'You vs last time — first.',
        'How hard by workout — next.',
        'The day. Then who went up. Then who went down.',
        'How hard by lift. Then every lift.',
        'Bonus done and optional — at the bottom.',
      ],
    },
    {
      heading: 'The days',
      wins: [
        'T — today. T-1 — yesterday.',
        'T-7, T-15, T-30, All — the last days, including today.',
        'Opens on T.',
      ],
    },
  ],
  kevin: {
    intro:
      'Same board, man. You keep the house. Check a name when you want more than you.',
    mid: 'The cards add. Empty is empty. I do not stack a second page for you.',
    close: 'Hard-refresh. Open Your performance. Start with you. Then pick who you want.',
    groups: [
      {
        heading: 'Your performance',
        wins: [
          'You vs last time — first.',
          'How hard by workout — next.',
          'The day. Then who went up. Then who went down.',
          'How hard by lift. Then every lift.',
          'Bonus done and optional — at the bottom.',
        ],
      },
      {
        heading: 'The days',
        wins: [
          'T — today. T-1 — yesterday.',
          'T-7, T-15, T-30, All — the last days, including today.',
          'Opens on T.',
        ],
      },
      {
        heading: 'More than you',
        wins: [
          'Check one name or more at the top.',
          'Their weight and totals add on the same cards.',
          'Check all if you want the lot. Uncheck all and it stays empty.',
        ],
      },
    ],
  },
  wins: [],
  also: [],
};
