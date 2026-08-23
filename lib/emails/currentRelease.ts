/**
 * User-facing release orders from Master Workit.
 * `/document` rewrites this from CHANGELOG Unreleased, then runs `npm run mail:release`.
 * Household tone only — no Netlify, env vars, or admin tooling.
 */
export type ReleaseGroup = {
  heading: string;
  wins: string[];
};

export const CURRENT_RELEASE: {
  version: string;
  title: string;
  subject?: string;
  signer?: string;
  onlyAthletesWithWorkouts?: boolean;
  onlyAthletes?: string[];
  lead?: string;
  groups: ReleaseGroup[];
  wins: string[];
  also: string[];
} = {
  version: '3.6.0',
  title: 'I built you a fifth day. Extra credit. Earn it.',
  subject: 'Bonus Upper is live. Four still locks the week. The fifth is for men who want more.',
  signer: 'Master Workit',
  onlyAthletesWithWorkouts: false,
  onlyAthletes: ['Kevin', 'Mike'],
  lead:
    'Man. I did not make the month a copy of weeks 1 and 2. Weeks 3 through 6 get harder. And I gave you a fifth day. Bonus Upper. Optional. Extra credit. Four still locks the week. The fifth is for the man who wants more of me.',
  groups: [
    {
      heading: 'Bonus Upper',
      wins: [
        'Weeks 3 through 6. Open Select Workout. Bonus Upper is sitting there. Shrugs. Pulldowns or pullovers. Skull crushers. Hammer curls. Reverse wrist curls. Dead bugs first. Side plank later. Travel swaps if you are in a hotel. Do not skip the form tapes.',
        'This is extra credit. Four sessions still lock the week. Home Start will not shove you onto bonus. Nudges will not nag you for it. You pick it because you want it, man.',
        'Leave a day between upper sessions. I am telling you, not locking the door. Lower the day after an upper is fine. Back-to-back uppers is you being greedy and sloppy.',
        'Finish one bonus week and I pin Bonus Day on you. The card counts unique weeks. Do Again does not farm it. Do the week. Then do another.',
        'Scoreboard honor roll. Unique bonus weeks. 7 days. 30 days. All time. I celebrate the men who showed up for extra. I do not rerank the house for it.',
      ],
    },
    {
      heading: 'The required days got harder',
      wins: [
        'Same lift names on the four required days. I did not swap your squat for a circus act. Sets, reps, and notes get meaner from week 3 on. Read the notes. Add the weight. Hold the plank longer.',
        'Week 6 says match or beat week 4. That is not poetry. That is the test.',
      ],
    },
    {
      heading: 'Who is actually bigger',
      wins: [
        'Vs the house now prints two numbers. Best day is your heaviest day on each lift, added up. Total weight is every set, weight times reps. Thousands get a k. No space. 4.1k. 50k. Same list in the Monday scoreboard letter. Stop mixing them up. Look. Then beat the man above you.',
      ],
    },
  ],
  wins: [],
  also: [
    'Hard-refresh this thing. Then get under the bar.',
    'Put Work-It on your iPhone home screen. Safari only. The steps are at the bottom.',
  ],
};
