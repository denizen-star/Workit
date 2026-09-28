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
  version: '11.0.0',
  title: 'Six weeks of more.',
  subject: 'Overload Progressions — six weeks of more weight',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    'I have been waiting to tell you this one. Once you finish week 6, a new door opens: Overload Progressions. Six weeks built for one thing. Putting more weight on the bar, week after week, because you earned it.',
  mid: 'It is simple. Hit the top of the rep range on every set, and your card tells you to add weight. Miss it, and it tells you to stay and get one more rep. Real rests on the heavy lifts, a target on every set, and three diplomas along the way. Every week you lock still counts toward your next belt. And the Next line and Aim line are on every lift card now, program days included.',
  close:
    'You do not have to guess anymore. The card tells you what you earned. Go earn it. I already know you will. Quit is the only thing that does not get a spot on the bar.',
  lead: '',
  groups: [
    {
      heading: 'Overload Progressions',
      wins: [
        'When — opens once you finish week 6. Look for the card on Home.',
        'Start — join any day, it begins the next Monday. Your program pauses until you leave.',
        'Your week — 1 to 3 days full body, 4 days upper/lower, 5 days upper/lower/push/pull/legs.',
        'Rests — 3 minutes on heavy lifts, 2 on the next ones, 75 seconds on the small ones.',
        'The climb — weeks 1-2 Fair, weeks 3-4 Hard, weeks 5-6 push the last set on the small lifts.',
        'Counts — locked weeks count toward belts, badges, the house board and medals.',
        'Diplomas — one each as weeks 2, 4 and 6 end.',
        'Leave any time — your program picks back up, moved ahead by the weeks you locked.',
      ],
    },
    {
      heading: 'On every lift card',
      wins: [
        'Next — what to lift next time. Earned it: +2.5 lb on curls and raises, +5 upper body, +10 legs.',
        'Not yet — same weight, one more rep.',
        'Just a suggestion — your numbers still fill in the way they always have. Shows in kg if you log in kg.',
        'Aim — how hard each set should feel, like "Hard · about 2 reps left".',
      ],
    },
    {
      heading: 'New lift',
      wins: [
        'Cable Chest Fly — with photos, a form video and how-to.',
        'Traveling — swap it for Backpack Floor Flyes, no equipment needed.',
        'No cables — tap Alt for Dumbbell Flyes.',
      ],
    },
  ],
  wins: [],
  also: [],
};
