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
  version: '13.1.0',
  title: 'Home opens in one go.',
  subject: 'Home opens faster — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    "Quick one, and it's all about speed! Home now loads everything in one go, so you get to your workout faster.",
  mid:
    "Behind the scenes, opening Home used to take nine separate trips to the server. Now it's one. The Medals page opens faster too, and your badges still land the second you finish a workout. Your performance now ranks you against your own house.",
  close:
    "Less waiting, more lifting. I believe in every rep you've got. Leave quit at the door. Let's go!",
  lead: '',
  groups: [
    {
      heading: 'Faster',
      wins: [
        'Home — loads in one go instead of nine trips.',
        'Medals — opens faster; badges still land when you finish.',
      ],
    },
    {
      heading: 'Fairer',
      wins: ['Your performance — ranks you against your own house.'],
    },
  ],
  wins: [],
  also: [],
};
