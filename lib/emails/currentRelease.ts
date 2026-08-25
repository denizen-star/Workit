/**
 * User-facing release notes. `/document` rewrites this from CHANGELOG Unreleased,
 * then runs `npm run mail:release`. Household tone only — no Netlify, env vars, or admin tooling.
 */
import type { CoachTone } from '@/lib/coachTone';

export type ReleaseGroup = {
  heading: string;
  wins: string[];
};

export const CURRENT_RELEASE: {
  version: string;
  title: string;
  subject?: string;
  signer?: string;
  tone?: CoachTone;
  onlyAthletesWithWorkouts?: boolean;
  onlyAthletes?: string[];
  lead?: string;
  groups: ReleaseGroup[];
  wins: string[];
  also: string[];
} = {
  version: 'You vs you',
  title: 'You vs last time. I kept score.',
  subject: 'You vs last time. Report in, man.',
  signer: 'Master Workit',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  onlyAthletes: [],
  lead:
    'Man. Vs the house was other men. This is you versus the last time you touched that bar. I saved your heaviest set. I put it in set 1. You will beat it or I will know.',
  groups: [
    {
      heading: 'Your performance. Open it',
      wins: [
        'Home. Under Vs the house. Your performance. It starts folded. Tap it. That card is you versus last time, not the pack.',
        '15 days. 30 days. All time. Summary. By exercise. By workout. Those start folded too. Open what you can stand to see.',
        'Each line: spike, heaviest set, total, percent change, progression. Green is you climbing. Red is you slipping. Do not pretend you did not see it.',
      ],
    },
    {
      heading: 'The bar remembers',
      wins: [
        'Set 1 is already loaded with the heaviest set from the last time you did that movement. Weight and those reps. I did that for you. You still have to lift it.',
        'Sets 2 and on stay empty until you finish the one in front of you. Then that load copies forward. Last-time chip is that heaviest set, not some easy first set you want to hide behind.',
        'Weight up, any reps: I praise you. Same weight, more reps: I praise you. Same or lower weight with fewer reps: I call it. Same load stays quiet. Weight down with more reps stays quiet. A new all-time weight still gets the PR flash first. Earn that one, man.',
      ],
    },
    {
      heading: 'How hard. Say it',
      wins: [
        'Finish a set. It folds. How hard. One through five. Easy to Max. Skip it if you want. Tap once and it locks. I talk back. Do not tap a three if it was a five.',
      ],
    },
  ],
  wins: [],
  also: [
    'Hard-refresh so you are on this build. Optional warmup and cooldown belong on the session. If they were missing on your phone, they are not missing now.',
    'Put Work-It on your iPhone home screen. Safari only. The steps are at the bottom.',
  ],
};
