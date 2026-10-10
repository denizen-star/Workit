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
  version: '14.1.4',
  title: 'A truer Effective number.',
  subject: 'A truer Effective number on Your performance',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro: "Small fix, big on honesty! The Effective number on Your performance now tells the truth when more than one person is combined.",
  mid:
    "Before, someone trying a lift for the first time could make the group number look better than it was, because there was nothing earlier to compare them to. Now only people with a last time to compare against count. Your own number never changed.",
  close: "Real numbers, real progress. I believe in you. Leave quit at the door!",
  lead: '',
  groups: [
    {
      heading: 'A truer number',
      wins: [
        'Effective for a group: a first-time lift no longer reads as growth.',
        'Your own number: unchanged.',
      ],
    },
  ],
  wins: [],
  also: [],
};
