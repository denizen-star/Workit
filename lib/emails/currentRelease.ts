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
  version: '13.0.0',
  title: 'Your phone can call you to train now.',
  subject: 'Workout reminders are here — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    "Big one today! You told yourself you'd train, and now I get to remind you. Pick a time, pick your days, and your phone taps you on the shoulder when it's go time.",
  mid:
    "Open the menu and Reminders is right at the top. Set your time, check the days you train, and tap Allow notifications. Then tap Send a test and watch it land. One thing: Work-It has to be saved to your Home Screen for this to work. Tap the ? in Reminders and it shows you how.",
  close:
    "I won't bug you on a day you already trained, and once your week is locked I leave you alone. You can turn it off whenever you want. But I think you'll like hearing from me. Leave quit at the door. Let's go!",
  lead: '',
  groups: [
    {
      heading: 'New: workout reminders',
      wins: [
        'Where — top of the menu, under Reminders.',
        'You choose — the time and the days of the week.',
        'Turn it on — tap Allow notifications once on each phone.',
        'Try it — Send a test shows you what it looks like.',
        "Smart — no reminder on a day you already trained or once your week is locked.",
        'Left a workout open? — the reminder takes you straight back to it.',
        'Needs the Home Screen — the ? in Reminders shows you how to save Work-It there.',
      ],
    },
    {
      heading: 'Small fix',
      wins: ['Help boxes — tapping inside a ? box in the menu no longer closes the menu.'],
    },
  ],
  wins: [],
  also: [],
};
