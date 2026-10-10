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

export type ReleaseDef = {
  version: string;
  title: string;
  subject?: string;
  onlyAthletesWithWorkouts?: boolean;
  activeInDays?: number;
  onlyAthletes?: string[];
  /** Names mailed on top of the audience (by full name or first name), e.g. invitees with no workouts yet. */
  alsoAthletes?: string[];
  includeNewAthletes?: boolean;
  lead?: string;
  intro?: string;
  mid?: string;
  close?: string;
  groups: ReleaseGroup[];
  kevin?: ReleaseCopy;
  wins: string[];
  also: string[];
};

export const CURRENT_RELEASE: ReleaseDef = {
  version: '14.1.0',
  title: 'Map your journey.',
  subject: 'Map your journey: pick your focus, your days, and a simpler Home',
  onlyAthletesWithWorkouts: true,
  alsoAthletes: ['Jose', 'Rudy Chacin', 'Blue Thomas'],
  includeNewAthletes: false,
  intro:
    "Big one, and it's all about you! Work-It now bends to your life. Train in the gym, on a mat, with two dumbbells at home, or with no equipment at all. And Home got simpler, so your next move is always one tap away.",
  mid:
    "Here's what happens the next time you open Home: a selection panel is waiting. Choose how many days you want to work out and what your focus is, and you customize the whole experience. Map your journey. Already happy with your program? Tap Continue as is and nothing changes. You can change your mind any time from Training focus in the menu. Whatever you pick, every workout counts toward your week, your belts and your medals the same way.",
  close:
    "Pick your days, pick your focus, show up. I believe in you. Leave quit at the door. Let's go!",
  lead: '',
  groups: [
    {
      heading: 'Pick your focus',
      wins: [
        'Build muscle · Gym: the program you know.',
        'Core Inspired: Pilates, yoga and core on a mat.',
        'Home · 2 Dumbbells: two full-body days that alternate.',
        'No equipment · Travel: bodyweight workouts anywhere.',
        'Pick more than one: your week alternates between them.',
      ],
    },
    {
      heading: 'Pick your days',
      wins: [
        'Seven buttons, M–S: tap the days you train.',
        'Your commitment drives: the days you pick set your weekly number. One day means one workout locks the week, two days means two.',
        '9am reminder on those days if notifications are on.',
        'Back-to-back full-body days: we warn you, because muscles rebuild on the rest day.',
      ],
    },
    {
      heading: 'A simpler Home',
      wins: [
        'Start Next: your next workout, with its focus and time.',
        'Pick one: Upper, Lower, Yoga, Core, Full body or Run, any time.',
        'One number: Effective, your last 15 days against last time.',
        'Invite a friend: one row at the bottom of the card.',
        'After a missed week: if you were on a streak, your coach says one week off is fine and it is time to get back to the iron.',
      ],
    },
    {
      heading: 'Your pick, your way',
      wins: [
        'Focus row: Build muscle, Core Inspired, Home or Travel. It starts on yours; tap more to widen it.',
        'Add or swap: one switch to add a workout to your week or swap it for a day you have not started.',
      ],
    },
    {
      heading: 'Change it any time',
      wins: [
        'Training focus in the menu: change your focus and days whenever you like.',
        'Next-week pill on Home: pick a different focus for just next week.',
        'Locked weeks: a week you already locked stays locked.',
      ],
    },
    {
      heading: 'New workouts',
      wins: [
        'Pilates A and B: 30-minute mat routines, every move with a video.',
        'Home Full-Body 1 and 2: Floor Press, Sumo Deadlift, Renegade Row, Arnold Press, Floor Flyes, Single-Leg Deadlift with Row, Woodchoppers.',
        'The Library: new Pilates and Home sections.',
        'Swaps: the new moves show up as Alt choices on the lifts they replace.',
      ],
    },
    {
      heading: 'Fixed',
      wins: ['Streak badges: they keep growing after a missed week, and badges you earned stay yours.'],
    },
  ],
  wins: [],
  also: [],
};
