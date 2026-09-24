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
  version: '10.0.0',
  title: 'Your pick. Your week.',
  subject: 'Your pick is here — any workout, any day, it all counts',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Mike', 'Christine', 'Peter', 'Kevin'],
  includeNewAthletes: false,
  intro:
    'Okay, this is the big one and I have been waiting to tell you. You asked for more say in your week. You got it. Starting now, you pick.',
  mid: 'Here is the part I love most. Your week locks on a number, not a schedule. Hit your workouts, any mix, and it is locked. Plan days, swaps, Your picks. All of it counts. So if Tuesday wants legs instead of upper, go do legs. I am not going to stop you. I am going to cheer.',
  close:
    'Open the app and try one this week. Swap a day, add a flow, go chase a new badge. I knew you had more in you than the plan asked for. Growth, lean, definition, power, stamina, mobility. Go take them. Quit is still the only thing not welcome in here.',
  lead: '',
  groups: [
    {
      heading: 'Your pick',
      wins: [
        'Pick a workout — Upper, Lower, Yoga, Core or Full body, any week, any day.',
        'Add it — on top of your week, as an extra.',
        'Swap it — tap Swap on any day you have not started. That day counts as done.',
        'It counts — toward locking your week, your belts and your medals.',
        'Find it — the gold Pick button on Home, or under each week in Select Workout.',
      ],
    },
    {
      heading: 'What else is new',
      wins: [
        'Yoga and Core — a 30-minute flow or a core circuit you tap through, or mark it done after 30 minutes. They count like a full workout.',
        'Friday from week 7 — Extra Upper is now a Your pick day. Want it? Pick Upper.',
        'The house — rank goes to who hit their days first, then the best average per workout. More sessions alone will not buy a spot.',
        'Every exercise — a Push, Pull, Legs or Core tag. The Library can filter by it.',
        'Seven new badges — start with Your Pick and go for Full Menu.',
        'The old bonus day — gone. Your pick replaced it. Everything you already logged still counts.',
      ],
    },
  ],
  wins: [],
  also: [],
};
