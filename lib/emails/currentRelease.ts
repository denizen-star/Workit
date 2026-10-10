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
  version: '14.2.0',
  title: 'Know which exercise is next.',
  subject: 'Your current exercise now stands out',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro: "Quick one, and you'll feel it on your very next workout! The exercise you're on now lights up.",
  mid:
    "Mid-session, every card used to look the same. Now the one you're working gets a gold edge, finished ones dim down, and the screen glides to the next card when you wrap one up. In a circuit, it also tells you which round you're in.",
  close: "Eyes on the gold, one set at a time. I believe in you. Leave quit at the door!",
  lead: '',
  groups: [
    {
      heading: 'Easier to follow',
      wins: [
        'Current exercise: gold edge and glow.',
        'Finished exercises: dimmed.',
        'Next card: the screen scrolls to it after you finish one.',
        'Circuits: shows Round N of M.',
      ],
    },
  ],
  wins: [],
  also: [],
};
