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
  version: '11.5.0',
  title: 'See your week.',
  subject: 'See your week — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    'You have been putting the work in. I see it. Now The house shows your week, day by day, so the days you showed up are right there in front of you.',
  mid: 'Under the time pills, your row runs Monday through Sunday. A green box means you finished a workout that day, and the number inside is how many. Open your row and you get each workout with its count. Right under you is the house: the average, rounded up, on those same seven days. Last 7 days is this calendar week. 30 days and all time roll every workout into its weekday.',
  close:
    'I believe in every day you show up. Keep stacking them. Quit is the only thing that stays off the week.',
  lead: '',
  groups: [
    {
      heading: 'New',
      wins: [
        'Your week — finished workouts for Monday through Sunday, with a count in each box.',
        'Green — that weekday has a workout.',
        'Open your row — each workout and how many times you did it.',
        'The house — average workouts, rounded up, on the same seven days.',
        'Last 7 days — this calendar week. 30 days and all time roll every workout into its weekday.',
      ],
    },
  ],
  wins: [],
  also: [],
};
