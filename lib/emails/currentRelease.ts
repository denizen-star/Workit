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
  groups: ReleaseGroup[];
  wins: string[];
  also: string[];
} = {
  version: '3.3.1',
  title: 'Hard-refresh. Then talk.',
  groups: [
    {
      heading: 'The phone',
      wins: [
        'Hard-refresh this thing, man. I cleaned the chrome. The gold mouth is still on the right. That is me. Tap it. Roast the app. Thank me. Pitch the next lift. Do not make me guess.',
        'On the workout, thumbs sit under the photos. Up if it is clean. Down if the video is dead, the picture is a lie, or something else is wrong. Something else means you write it.',
        'You do not finish and you do not quit until you score it. One is weak. Five is you want it again. Stay for More and I throw that score in the trash.',
      ],
    },
    {
      heading: 'Home',
      wins: [
        'Your numbers sit next to the household. You see who showed up. You see who went soft. I already know.',
        'Score a session and your enjoyment charts show. Empty boards stay hidden. I do not decorate silence.',
      ],
    },
  ],
  wins: [],
  also: [
    'Put Work-It on your iPhone home screen. Safari only. The steps are at the bottom. Follow them. Browser tabs are for people who go soft.',
    'Hard-refresh. Then get under the bar, man.',
  ],
};
