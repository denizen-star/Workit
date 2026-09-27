/**
 * User-facing release notes. `/document` rewrites this from CHANGELOG Unreleased,
 * then runs `npm run mail:release`. Written in Eli Sparks's voice (every athlete gets
 * the same letter, whoever their coach is). Household tone only — no Netlify, env vars, or admin tooling.
 */

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
  version: '10.2.1',
  title: 'Your effort, saved right',
  subject: 'Fixed: How hard now saves the rating you pick',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Kevin'],
  includeNewAthletes: false,
  intro:
    'Quick one, and it matters. You told me your effort was not sticking after you picked it. You were right, and it is fixed.',
  mid: 'Every How hard you give me feeds your Effort numbers, your board weight and the call I make at the end of each exercise. So when you say Hard, I want Hard on the record. Not Light. Now that is what lands.',
  close:
    'Go lift, rate it honest, and watch it hold. Your work deserves to count exactly the way you did it. Quit is the only thing that does not get a score in here.',
  lead: '',
  groups: [
    {
      heading: 'Fixed',
      wins: [
        'How hard — drag to your rating and let go. That is the one that saves.',
        'Editing a set — change your vote and the new one sticks.',
        'Yoga and Core picks — rating a hold moves you on one hold, with the score you chose.',
        'Older sets — anything rated before today may read Light or Easy. Tap the set and use Editing to fix it.',
      ],
    },
  ],
  wins: [],
  also: [],
};
