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
  version: '12.0.0',
  title: 'More lifts to pick from, and a Skip that waits for you.',
  subject: 'More lifts in Add exercise — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    "You told me the Add exercise list felt thin. You were right, and I love that you're hungry for more.",
  mid:
    "So Add exercise now pulls from the whole Library: gym lifts, travel moves and the Alt picks, close to 80 to choose from. Chest alone went from 3 to 10, with flyes, dips, cable fly and push-ups next to the presses. Remove exercise is red now, so you can't miss it. And the Skip button waits out your rest before it goes away, even when you move to the next exercise.",
  close:
    "More tools, same mission: show up, do the work, and leave quit at the door. I believe in you.",
  lead: '',
  groups: [
    {
      heading: 'New',
      wins: [
        'Add exercise — pick from the whole Library, about 80 lifts. Chest has 10 now.',
        'The Library — Chest Dips, Dumbbell Flyes and High-to-Low Cable Fly have their own cards.',
      ],
    },
    {
      heading: 'Changed',
      wins: [
        'Remove exercise — red, so it stands out.',
        'Skip button — stays up through your rest timer, then a little longer.',
      ],
    },
  ],
  wins: [],
  also: [],
};
