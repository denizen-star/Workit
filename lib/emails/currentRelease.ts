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
  version: '13.1.1',
  title: 'Home shows up sooner.',
  subject: 'Home shows up sooner — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    "Quick one! Home shows up sooner now, so you're one tap from your workout the moment you open the app.",
  mid:
    "Your next workout, the Start button and your week lock appear right away. Your stats, medal and numbers fill in a moment later, and the whole page finishes loading faster than before.",
  close:
    "Open it, tap Start, get to work. I believe in you. Leave quit at the door. Let's go!",
  lead: '',
  groups: [
    {
      heading: 'Faster Home',
      wins: [
        'Next workout, Start, week lock — right away.',
        'Stats, medal, numbers — a moment later.',
        'Whole page — done sooner than before.',
      ],
    },
  ],
  wins: [],
  also: [],
};
