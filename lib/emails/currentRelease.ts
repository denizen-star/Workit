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
  version: '14.1.3',
  title: 'Your performance, faster.',
  subject: 'Your performance now opens faster',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    "Quick one, and you'll feel it! Your performance page used to make you wait. Not anymore.",
  mid:
    "Your lifts now show up the moment they're ready, and the house comparison fills in right behind them instead of holding everything up. Same numbers, less waiting.",
  close: "Open it, see where you moved up, then go lift. I believe in you. Leave quit at the door!",
  lead: '',
  groups: [
    {
      heading: 'Faster to open',
      wins: [
        'Your performance: your lifts appear first, the house tile follows.',
        'Home: the Effective number loads lighter.',
        'After a workout: the recap comes up quicker.',
      ],
    },
  ],
  wins: [],
  also: [],
};
