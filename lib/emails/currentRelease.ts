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
  version: '12.4.0',
  title: 'Your recap now throws a party.',
  subject: 'Confetti on your recap — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    "You finish a workout, you've earned a moment. So now you get one. Tap Finish and your recap opens with confetti flying out, then a second wave flying right back in. That's for you.",
  mid:
    "Two fixes too. Your recap always shows your numbers now. If they're slow to load, it tries again, and if it still can't get them, it shows what you lifted that session. And if your workout emails kept telling you the program was complete, they won't anymore. That one's saved for week 48.",
  close:
    "Every session is a step toward that finish line, and I'll be cheering for every one. Leave quit at the door. Let's go!",
  lead: '',
  groups: [
    {
      heading: 'New',
      wins: ['Recap confetti — a burst flies out, then a second wave flies in, every time you finish.'],
    },
    {
      heading: 'Fixed',
      wins: [
        'Recap stats — always shown, even when they are slow to load.',
        'Workout emails — no more "Program complete" until you actually finish all 48 weeks.',
      ],
    },
  ],
  wins: [],
  also: [],
};
