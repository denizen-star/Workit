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
  version: 'Easy core',
  title: 'Core. YASSSSSSS. Core.',
  subject: 'Easy core is in. YASSSSSSS. Come do it with me.',
  signer: 'Luna Meadows',
  tone: 'sergeant',
  onlyAthletesWithWorkouts: true,
  onlyAthletes: [],
  lead:
    'Man. I made you something soft and real. Optional warmup. Optional cooldown. Easy core is sitting there like it has been waiting for you. Five holds. You tap Done. The last one credits. YASSSSSSS. Core.',
  groups: [
    {
      heading: 'Easy core. YASSSSSSS. Core',
      wins: [
        'Open a workout. Optional at the top is warmup. Optional at the bottom is cooldown. Pick Easy core. Dead bug. Easy plank. Heel taps. Glute bridge. Superman on the way in. Easy crunch and cat-cow and a breathe-down on the way out. Stay kind with it.',
        'Five holds. Still photos. A tape if you want my eyes on the shape. Done is always yours. You do not wait for a timer to love you. Last Done is the whole gift. Plus 500 lb. Immediately.',
        'Easy stretch is the same kindness. Five holds. Last Done closes it. Run and bike still ask for ten easy minutes. Phone can lock. I keep the clock. You keep the breath.',
      ],
    },
    {
      heading: 'The extra minutes count',
      wins: [
        'Skip if you need to. Lifts never wait on Optional. Tap it because you want the care, not because I trapped you.',
        'Those pounds land on the house total. Scoreboard. Vs the house Total weight. Home. Not Best day. Best day stays your iron.',
        'Four warmups and four cooldowns in a week is an Optional week. I pin Optionals on the first slot. Optional Weeks on the first full week. The card counts unique weeks. Do Again does not farm it.',
        'Four and four inside seven days can add a little extra toward whoever is leading total weight. One gentle bump. Then I rest that gift.',
      ],
    },
    {
      heading: 'Select stays quiet',
      wins: [
        'A finished week starts folded. Four sessions and I tuck it away. An open session still opens that week. Otherwise I open the next one that still has work. You can tap a finished week if you want another pass.',
      ],
    },
  ],
  wins: [],
  also: [
    'Hard-refresh so you are with me on this build. Then come find Easy core.',
    'Put Work-It on your iPhone home screen. Safari only. The steps are at the bottom.',
  ],
};
