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
  version: '11.7.0',
  title: 'The numbers are in.',
  subject: 'Performance Scorecards — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Kevin Leacock'],
  includeNewAthletes: false,
  intro: 'We have been watching the clock. Every set, every rest, every moment you hold the line. Now we are showing you exactly what that looks like.',
  mid: 'We just rolled out Performance Scorecards. This is a personalized breakdown of your pacing and rest times. We see the average time you spend per set, and we see when you rush through an accessory movement in under 15 seconds. If you are speedrunning, we are going to tell you to slow down to prevent injury. If you are holding the standard, we are going to tell you exactly how you beat the house.',
  close: 'Take your full rests. Keep your form tight. I believe in the work you are doing. Quit is the only thing we do not measure.',
  lead: '',
  groups: [
    {
      heading: 'New',
      wins: [
        'Performance Scorecards — personalized telemetry showing your average time per set and your rate of rushed sets.',
        'House Averages — your scorecard compares your pacing directly to the rest of the house.',
        'Injury Prevention — we flag when you skip your 90-second rests so you can fix it before an injury happens.',
      ],
    },
  ],
  wins: [],
  also: [],
};
