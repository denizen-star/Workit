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
  version: '11.11.0',
  title: 'Your workout, your call.',
  subject: 'Add or remove exercises — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    "You've put in the weeks, and it shows. From week 7 on, you know your body and you know your gym. So I'm handing you more of the wheel.",
  mid:
    "On a live workout you can now add an exercise or take one off. Tap Add exercise at the end of your workout to pick any lift from the program, up to four. Tap Remove exercise under a card you haven't started to drop it. The program is built so every week hits every muscle group, so this one's your call and your risk. The first change in a workout asks you to confirm, and it's for that workout only. Next time, you're back on the plan.",
  close:
    "Make it yours, keep the form clean, and leave quit at the door. I'm right here with you.",
  lead: '',
  groups: [
    {
      heading: 'New',
      wins: [
        'Add exercise — from week 7, put any lift from the program at the end of your workout. Up to four.',
        "Remove exercise — drop a card you haven't started yet.",
        'Your call — the first change in a workout asks you to confirm. Changes last for that workout only.',
      ],
    },
    {
      heading: 'Fixed',
      wins: ['Skip button — it stays put now instead of switching back early.'],
    },
  ],
  wins: [],
  also: [],
};
