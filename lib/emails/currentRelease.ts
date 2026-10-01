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
  version: '11.6.0',
  title: 'Your week, right away.',
  subject: 'Your week, right away — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    'The weekday boxes on The house were showing up a beat late. You already had the house on screen. Those boxes should have been there with it. They are now.',
  mid: 'Same seven days, Monday through Sunday. Green still means you finished a workout that day. Open your row for each workout and how many times. The house average sits right under you, rounded up. It all lands together now, with the rest of The house.',
  close: 'I believe in the days you show up. Keep stacking them. Quit is the only thing that stays off the week.',
  lead: '',
  groups: [
    {
      heading: 'New',
      wins: [
        'Weekday boxes — they show with the rest of The house, not a moment later.',
        'Your week — Monday through Sunday, a count in each box. Green means that day has a workout.',
        'Open your row — each workout and how many times you did it.',
        'The house — average workouts, rounded up, on the same seven days.',
      ],
    },
  ],
  wins: [],
  also: [],
};
