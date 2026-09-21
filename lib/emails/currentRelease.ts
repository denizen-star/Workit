/**
 * User-facing release notes. `/document` rewrites this from CHANGELOG Unreleased,
 * then runs `npm run mail:release`. Household tone only — no Netlify, env vars, or admin tooling.
 */
import type { CoachTone } from '@/lib/coachTone';

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
  signer?: string;
  tone?: CoachTone;
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
  version: '8.0.0',
  title: 'This one is for Peter and Christine.',
  subject: 'This one is for Peter and Christine.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: false,
  onlyAthletes: ['Kevin', 'Peter', 'Christine', 'Mike'],
  includeNewAthletes: false,
  intro:
    'Man, no machine for the lift, or a movement you have gone cold on — that used to mean skip it or force it. Not anymore.',
  mid: 'Alt sits right on the card now. Tap it, pick from a short list that hits the same muscle, and see the body diagram so there is no guessing what it works. No equipment where you are — the plane icon marks the picks that need nothing but you. The swap holds for the day, then the original is back, and whatever you swap in keeps its own record from the first set. Your record itself got smarter too — it is weight times reps now, not just the number on the bar. Bring more reps at a fair weight and it counts the same as adding plates.',
  close: 'Growth does not care which version of the lift moved it. Pick what fits, do the work, log it. Quit is still the only thing not welcome in here.',
  lead: '',
  groups: [
    {
      heading: 'Added',
      wins: [
        'Alt Exercise — swap any lift for one of a few picks that hit the same muscle, right from the card. Plane icon marks the ones that need no equipment at all',
      ],
    },
    {
      heading: 'Changed',
      wins: [
        'Personal records — now weight × reps, not weight alone. More reps at a solid weight can beat a heavier, lower-rep set',
        'Per-lift Gym/Travel toggle is gone — Travel-friendly swaps now live inside Alt Exercise instead',
      ],
    },
  ],
  wins: [],
  also: [],
};
