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
  version: '12.4.1',
  title: 'Your belts got brighter.',
  subject: 'New belt colors — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    "Quick one, and it's a good one. Some of your belts looked too much like the one before them, and you deserve to see every step up. So two of them got brand-new colors.",
  mid:
    "Your 12-week belt is now blue, and your 30-week belt is now purple. You'll see the new color wash over your whole workout once you earn them, and on your diploma too. Each belt you lock in now looks like its own win.",
  close:
    "Every week you lock gets you closer to that next color, and I can't wait to see you wearing it. Leave quit at the door. Let's go!",
  lead: '',
  groups: [
    {
      heading: 'New look',
      wins: [
        '12-week belt — now blue (it was dark green).',
        '30-week belt — now purple (it was copper).',
      ],
    },
  ],
  wins: [],
  also: [],
};
