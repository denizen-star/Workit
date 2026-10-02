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
  version: '11.8.0',
  title: 'Your pick, your exact workout.',
  subject: 'Pick the exact workout — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    'You asked for more say on your Your pick day, and I love that. You know what your body needs this week, so now you get to choose exactly what you train.',
  mid:
    'Tap Pick and you get one dropdown grouped Upper, Lower, Full body and Core. Want Lower B on a one-lower week? It is right there. Feel like a hinge day, or glutes, or chest and arms? Pick it. Before you start, a gold card tells you what makes that workout different and lists every lift, so there are no surprises. We also fixed a bug where Upper, Lower and Full body picks opened a full-body workout. Whatever you pick is what you get now.',
  close:
    'Choose it, own it, finish it. I believe in every rep you put in this week. Quit does not get a vote.',
  lead: '',
  groups: [
    {
      heading: 'New',
      wins: [
        'One dropdown — Upper, Lower, Full body and Core, all in one list.',
        'Exact workouts — Upper A or B, Lower A or B, or packs like Hinge, Glutes or Chest and arms.',
        'Preview card — one line on what sets it apart, then every lift with sets × reps.',
      ],
    },
    {
      heading: 'Fixed',
      wins: ['Your pick — Upper, Lower and Full body now open the workout you chose, not a full-body one.'],
    },
  ],
  wins: [],
  also: [],
};
