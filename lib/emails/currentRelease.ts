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
  version: '13.0.2',
  title: 'Quicker, and your records are fair.',
  subject: 'Work-It got quicker — and your PRs got fairer',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    "Big news, and it's all for you! Work-It got quicker. Finishing a workout, logging a set and opening Home all land faster now.",
  mid:
    "Your records got fairer too. New PR and Best now count the same way the rest of the app does: weight times reps, with your body weight in there on body-weight moves. More reps at a lighter weight can be a record. You earned it, so it counts.",
  close:
    "Faster screens mean more time under the bar. I believe in every rep you've got. Leave quit at the door. Let's go!",
  lead: '',
  groups: [
    {
      heading: 'Quicker',
      wins: [
        'Finish a workout — the recap and awards show up sooner.',
        'Log a set — it saves faster.',
        'Home, The house, your stats — all open quicker.',
        'Live workout — smoother while the clock runs.',
      ],
    },
    {
      heading: 'Fairer',
      wins: [
        'New PR and Best — weight times reps, body weight included.',
        "Rushed workouts — half or more sets skipped don't count toward Bonus Day, Perfect Week or your weekly counts.",
        'Completed log — your best session leaves out skipped sets.',
        'Places — 21st, 22nd, 23rd now read right.',
        'Vs the house — totals read 12k, same as everywhere else.',
      ],
    },
  ],
  wins: [],
  also: [],
};
