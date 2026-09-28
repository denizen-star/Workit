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
  version: '11.1.0',
  title: 'Your push-ups count now.',
  subject: 'Your push-ups count now — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Kevin'],
  includeNewAthletes: false,
  intro:
    'Big one today! Every push-up, every dip, every knee raise you have ever done was worth zero pounds on your board. Not anymore. Your own body is the weight now, and it finally counts.',
  mid: 'All it takes is your weight in Edit profile. If you have not saved one, you will see a banner on Home asking for it. Tap Add weight, type it in, done. It is private. Only you and Kevin ever see it.',
  close:
    'So drop down and give me twenty, and watch them land on your total this time. I believe in every rep you put in. Quit is the only thing that still counts for nothing.',
  lead: '',
  groups: [
    {
      heading: 'New',
      wins: [
        'Bodyweight moves — push-ups, dips, squats, lunges, rows and knee raises count part of your weight on every rep.',
        'Extra weight — a vest or backpack goes in the weight box and counts on top.',
        'Your weight over time — Your performance, Body weight.',
        'Add your weight — a banner on Home and your next few workouts until you save it.',
        'Recap — shows the weight your bodyweight moves used.',
      ],
    },
    {
      heading: 'Also',
      wins: [
        'Past sets — if you had already saved a weight, your old bodyweight sets now count too.',
        'Six-week check-in — now asks for your current weight as well.',
        'Hip thrusts and leg extensions — now ask for the weight you actually lifted.',
      ],
    },
  ],
  wins: [],
  also: [],
};
