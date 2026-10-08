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
  kevin?: ReleaseCopy;
  wins: string[];
  also: string[];
} = {
  version: '13.0.1',
  title: 'Reminders, tucked in neat.',
  subject: 'Reminders got tidier — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    "Quick one! Reminders got a little tidier so your menu stays clean and you get straight to your workout.",
  mid:
    "The first two times you open the menu, Reminders opens up so you can set your time and days. After that it sits as one line at the top. Tap it any time to change your reminder.",
  close:
    "Set it once, and let me be the one who shows up on your phone. Leave quit at the door. Let's go!",
  lead: '',
  groups: [
    {
      heading: 'Tidier menu',
      wins: [
        'First two times — Reminders opens on its own so you can set it up.',
        'After that — it sits as one line at the top of the menu.',
        'Need it? — tap Reminders to open it again.',
      ],
    },
  ],
  wins: [],
  also: [],
};
