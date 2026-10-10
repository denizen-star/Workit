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

export type ReleaseDef = {
  version: string;
  title: string;
  subject?: string;
  onlyAthletesWithWorkouts?: boolean;
  activeInDays?: number;
  onlyAthletes?: string[];
  /** Names mailed on top of the audience (by full name or first name), e.g. invitees with no workouts yet. */
  alsoAthletes?: string[];
  includeNewAthletes?: boolean;
  lead?: string;
  intro?: string;
  mid?: string;
  close?: string;
  groups: ReleaseGroup[];
  kevin?: ReleaseCopy;
  wins: string[];
  also: string[];
};

export const CURRENT_RELEASE: ReleaseDef = {
  version: '14.3.0',
  title: 'Circuits are here.',
  subject: 'New in Your pick: supersets, circuits and easy HIIT',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro: "Big one, and it's ready for your next workout! Your pick now has a Circuits section: supersets, circuits and an easy HIIT.",
  mid:
    "A superset pairs two moves back to back with no rest between them, then you rest and go again. A circuit strings three or more together, and one even starts every round with an easy run. Easy HIIT is 40 seconds on, 20 off, with a clock that moves you along. One move on screen at a time, your weight ready from the last round, and every one counts toward your week like any Your pick.",
  close: "Pick one, go round by round. I believe in you. Leave quit at the door!",
  lead: '',
  groups: [
    {
      heading: 'New in Your pick',
      wins: [
        'Supersets: Push / Pull and Legs.',
        'Circuits: Run + lifts, and Full body.',
        'Easy HIIT: 40 seconds on, 20 off, four rounds.',
        'Counts: toward your week, belts and medals.',
      ],
    },
  ],
  wins: [],
  also: [],
};
