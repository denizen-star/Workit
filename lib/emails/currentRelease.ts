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
  version: '11.3.0',
  title: 'One clear number before every lift.',
  subject: 'One clear number before every lift — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Kevin'],
  includeNewAthletes: false,
  intro:
    'You told me the top of every lift card was a lot to read, and you were right! Four hints, two of them pointing at different weights. That is noise between you and the bar, and you deserve better.',
  mid: 'So now it is one line: what you did last time and how hard it felt. Beat it. On Overload Progressions you get one gold Aim for box with your target, why, and how hard to go. And if you went all-out last time, it asks you to match it, not pile on more.',
  close:
    'Less reading, more lifting. I believe you have more in you than last time, every single time you walk in. Quit is the only thing that never moves the bar.',
  lead: '',
  groups: [
    {
      heading: 'Changed',
      wins: [
        'Lift cards — one line on top: Last time, with your Effort.',
        'Overload Progressions — one gold Aim for box: target, reason, how hard, last time.',
        'After a Max — Aim for asks you to match it, keep a rep in the tank. Never more.',
        "Beat the target — the box says You're past it.",
      ],
    },
    {
      heading: 'Gone',
      wins: ['Beat last week chip — it could suggest weights way off your target.'],
    },
  ],
  wins: [],
  also: [],
};
