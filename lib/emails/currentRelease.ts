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
  version: '12.2.0',
  title: 'Lace up. Running counts now.',
  subject: 'Run as its own workout — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    "Some days your legs want the road, not the rack. I love that, and now Work-It gives you credit for it.",
  mid:
    "Open Your pick and you'll find Run: 10, 20 or 30 minutes. The clock counts down, then keeps going as long as you do. Rate it, Finish it, and it counts toward your week, your belts and your medals. Your warmup and cooldown run asks for a length too now, and longer runs earn more. Finish your first one and there's a badge waiting for you.",
  close:
    "Every step is stamina in the bank. Pick a length, go get it, and leave quit at the door. I believe in you.",
  lead: '',
  groups: [
    {
      heading: 'New',
      wins: [
        'Run in Your pick — 10, 20 or 30 minutes. Earns 500, 1,000 or 1,500 lb and counts toward your week.',
        'First Run badge — finish your first Your pick run.',
      ],
    },
    {
      heading: 'Changed',
      wins: [
        'Warmup and cooldown run — pick 10, 20 or 30 minutes. Longer runs earn more.',
        'Run time — your Your pick runs add to the run and bike totals on Your performance and The house.',
      ],
    },
  ],
  wins: [],
  also: [],
};
