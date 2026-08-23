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
  lead?: string;
  groups: ReleaseGroup[];
  wins: string[];
  also: string[];
} = {
  version: '3.5.0',
  title: 'Now you can see who is actually bigger.',
  subject: 'This is for MIKE! You can effectively compare size...',
  signer: 'Master Workit',
  onlyAthletesWithWorkouts: true,
  lead:
    'Mike. Man. The rest of you too. I built you a tape measure. Weight is one board. Reps are another. Stop guessing who is bigger. Open it and look.',
  groups: [
    {
      heading: 'Vs the house',
      wins: [
        'Home. Under the scoreboard. Vs the house. It starts folded. Open it, man. Two boards. Best-day weight. Best-day reps. Separate races. I do not mash them into one soft number.',
        'You lead on a lift? I say it. Closest man named. You are behind? I say who. No poetry. Mike leads on hip thrusts, closest Christine. Mike is behind Kevin on calves. That is the sentence. Eat it.',
        'I compare you to your pack. If someone is a class above you I do not parade that blowout. You hunt the man next to you. Then you take his place.',
        '7 days. 30 days. All time. Pick a window. Then go beat it.',
      ],
    },
    {
      heading: 'The mail and the house numbers',
      wins: [
        'Monday scoreboard mail now prints your standing. Weight board. Reps board. Your name. Their name. Do not pretend you did not see it.',
        'The you / household numbers on Home include you now. You are in the house. Act like it.',
      ],
    },
  ],
  wins: [],
  also: [
    'Hard-refresh this thing. Then get under the bar.',
    'Put Work-It on your iPhone home screen. Safari only. The steps are at the bottom.',
    'If you have not finished a workout you do not get this letter. Earn the next one.',
  ],
};
