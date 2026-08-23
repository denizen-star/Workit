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
  lead?: string;
  groups: ReleaseGroup[];
  wins: string[];
  also: string[];
} = {
  version: '3.4.0',
  title: 'You talked. I built.',
  lead:
    'We heard your feedback, man. Keep it coming. Those reviews are useful. Thank you.',
  groups: [
    {
      heading: 'On the floor',
      wins: [
        'Want another set? Add it. Five extras. I copy the last one you finished. Did not do it? Yank it. I do not keep ghosts.',
        'Finish a set and it folds. Gray. Dead. Tap it if you need to edit. That button turns gold and says Editing. Complete Set stays gold. That is the only color that means go.',
      ],
    },
    {
      heading: 'After you finish',
      wins: [
        'Home has a Completed log under Weekly Progress. It starts folded. Open it. Every set you logged is sitting there. Week cards jump you to that week.',
        'Select Workout uses that same card on a finished day. Actual time. Not my estimate. Date. Sets. Tap it and read the work. Do Again is a small button on the header. Leave it if you already did the job.',
      ],
    },
    {
      heading: 'The tapes',
      wins: [
        'Hip thrusts and glute bridges have two tapes now. Watch the one you are doing. Farmer carries have a real tape. Travel glutes and farmers use the same ones. No more dead links, man.',
      ],
    },
  ],
  wins: [],
  also: [
    'Hard-refresh this thing. Then get under the bar.',
    'Keep scoring sessions. Keep talking. I read every star and every note.',
    'Put Work-It on your iPhone home screen. Safari only. The steps are at the bottom.',
  ],
};
