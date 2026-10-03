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
  version: '11.10.0',
  title: 'Every set you log should be a set you did.',
  subject: 'Skipped sets are here — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    "Your numbers are yours, and I want every one of them to mean something. When you look back at a week of work, I want you to trust every pound on that board.",
  mid:
    "So some sets now save as Skipped. You'll see it right on the button: it turns white, says Skip, and shows a little fast-forward arrow. A skipped set stays in your log and your recap, but it doesn't count toward your totals, your records or your history. Did the work and it got marked anyway? No problem. Open that set with Editing, tap Complete Set, and it counts again.",
  close:
    "Real reps, real growth. Take the set, own the set, and leave quit at the door. I believe in you this week.",
  lead: '',
  groups: [
    {
      heading: 'New',
      wins: [
        'Skip button — white, with a fast-forward arrow. A set saved with it is marked Skipped.',
        "Skipped sets — shown in your log and recap, but they don't add to totals, records or history.",
        'Changed your mind — open the set with Editing and tap Complete Set. It counts again.',
      ],
    },
  ],
  wins: [],
  also: [],
};
