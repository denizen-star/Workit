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
  version: '11.9.0',
  title: 'Your core gets a real rotation.',
  subject: 'New core moves, decline press, leg press — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    'Some of you noticed your ab move kept coming back as the same two or three. You were right, and I love that you were paying attention. Your core deserves more than a rerun.',
  mid:
    'From week 4 there are now 12 core moves, not 5: crunches, reverse crunches, bicycle crunches, Russian twists, woodchops, hanging leg raises, the ab wheel and more. It changes every week, never repeats inside a week, and switches between the start and the end of your workout. From week 7, Upper B opens with a decline press for the lower chest, and Lower B swaps the leg extension for the leg press, a heavier quad lift. The old moves are one Alt tap away if your gym is missing something. Your hanging knee raises keep all their history, and the weight and reps boxes now sit level.',
  close:
    'New moves, same you. Show up, brace that core, and leave quit at the door. I believe in you this week.',
  lead: '',
  groups: [
    {
      heading: 'New',
      wins: [
        '12 core moves — a different one every week, starting week 4.',
        'Decline press — Upper B leads with it from week 7. Incline is your first Alt.',
        'Leg press — Lower B\'s main quad lift from week 7. Leg extension and goblet step-ups are on its Alt list.',
        'Travel days — bar, wheel and cable core moves have a no-equipment version.',
      ],
    },
    {
      heading: 'Better',
      wins: [
        'Core spot — flips between the start and the end of your workout each week.',
        'Hanging knee raises — their own move now, history kept, with a new shoulder tip.',
        'Weight and reps boxes — side by side and level.',
      ],
    },
    {
      heading: 'Fixed',
      wins: [
        'Your pick — no more getting stuck on the Loading screen.',
        'Goblet step-ups — real step-up photos.',
      ],
    },
  ],
  wins: [],
  also: [],
};
