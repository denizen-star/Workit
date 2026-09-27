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
  version: '10.3.0',
  title: 'No more waiting for Monday.',
  subject: 'Test Drive — new faces start the day they join',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Kevin'],
  includeNewAthletes: false,
  intro:
    'I have got a good one for you. Nobody joins Work-It and then just sits around waiting for Monday anymore. The day they walk in is the day they start.',
  mid: 'Here is how it works. Week 1 still starts on a Monday, because a clean week is a fair week. But if someone joins on a Wednesday, they get a Test Drive: a couple of real workouts to learn the app and feel the work. Those count for them, not for the board. So nobody gets a head start on you, and nobody feels left out either.',
  close:
    'And when you finish a workout now, you will see the app working for you. Saving, calculating, checking. That is your growth being counted. Go give it something to count. Quit is the only thing not welcome here.',
  lead: '',
  groups: [
    {
      heading: 'Test Drive',
      wins: [
        'Joined mid-week — start the same day with a Test Drive.',
        'How many — 3 workouts from Tuesday, 2 Wednesday to Friday, 1 on the weekend.',
        'Countdown — Home shows how many days until Week 1 starts.',
        'Finished early — confetti, and a look at what you did: workouts, pounds, time.',
        'Counts for you — your totals, stats, badges and lift history. Not Week 1, belts, the house board or medals.',
        'Monday — leftover Test Drive workouts disappear, and your coach welcomes you to Week 1.',
      ],
    },
    {
      heading: 'Finishing a workout',
      wins: [
        'Complete it — the button now shows Saving, Calculating, Checking while your numbers land.',
        'One tap — tapping twice will not save the workout twice.',
        'Same for Yoga, Core and the Hyrox milestone.',
      ],
    },
  ],
  wins: [],
  also: [],
};
