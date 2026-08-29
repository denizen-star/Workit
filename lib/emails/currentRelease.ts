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
  version: 'Honest iron',
  title: 'The board was lying. I made it tell the truth, man.',
  subject: 'Your numbers were wrong. Here is the honest board.',
  signer: 'Master Workit',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  onlyAthletes: [],
  lead:
    'Man. You typed 155 and I saved 1. You never hit Complete on that row and Finish still closed the day. A 1-rep joke or an 8-pound baby set sat on a finished workout. Recap counted ghosts. Some of your real work never made the house total because it was still marked open. That is nuts. I do not play with your iron.',
  groups: [
    {
      heading: 'What I did to you',
      wins: [
        'Complete is the only write. Typing is not a set. Finish throws unfinished drafts in the trash. The house, Home all-time, and recap add completed sets only. Weight is pounds times reps. Plank is the load once, not the seconds. Optional still sits on top.',
        'Christine, Kevin, Mike: I went lift by lift with the real numbers and marked them done. Duplicate Kevin leg-curl set 1 is gone. Daily totals rebuilt. Open unfinished rows on finished days: zero.',
      ],
    },
    {
      heading: 'The three of you, all-time iron then vs now',
      wins: [
        'Christine: iron 9,522 lb → 10,683 lb (+1,161). Optional +500. Total weight 11,183. Reps 425 → 484 (+59).',
        'Kevin: iron 86,380 lb → 100,988 lb (+14,608). Optional +500. Total weight 101,488. Reps 1,084 → 1,306 (+222). You were the biggest lie on the board, man. Those 1-rep laterals and 8-pound rows were not work. They are work now.',
        'Mike: iron 91,203 lb → 102,114 lb (+10,911). Optional 0. Total weight 102,114. Reps 1,383 → 1,545 (+162). Those 100-pound squats count. The 13-pound ghost does not.',
        'Those three together: iron 187,105 lb → 213,785 lb (+26,680). Reps 2,892 → 3,335 (+443). Everyone else who already finished honest sets did not move. Look at The house. That is the pack.',
      ],
    },
    {
      heading: 'What you will do on the next session',
      wins: [
        'Type the load. Hit Complete. If you walk off mid-number, Finish will not keep that trash.',
        'Want more rest? Edit profile. Extra rest per break defaults to 0. Stock is 60 seconds. Extra minutes apply to later workouts. I did not give you a free 5-minute nap between lifts.',
        'Easy stretch and Easy core: five holds. Done stays on the bottom of the screen for warmup and cooldown. Last hold credits +500. Do not tell me you could not tap it.',
        'Need kilos on a card? Flip lb/kg next to Gym/Travel. I still store pounds. The house still speaks pounds.',
      ],
    },
  ],
  wins: [],
  also: [
    'Hard-refresh so you are on this build. Then open The house and look at your line.',
    'Tap a Week lock or Week performance tile if you forgot what it means.',
    'How hard charts live on Your performance. I want to see if you are actually working or posing.',
    'Put Work-It on your iPhone home screen. Safari only. Steps at the bottom. Gold Start in the dock, man.',
  ],
};
