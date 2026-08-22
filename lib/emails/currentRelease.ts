/**
 * User-facing release orders from Master Workit.
 * `/document` rewrites this from CHANGELOG Unreleased, then runs `npm run mail:release`.
 * Household tone only — no Netlify, env vars, or admin tooling.
 */
export const CURRENT_RELEASE: {
  version: string;
  title: string;
  wins: string[];
  also: string[];
} = {
  version: '3.3.0',
  title: 'Talk to me, man.',
  wins: [
    'You see that gold mouth on the right? That is me. Tap it. Roast the app. Thank me. Pitch the next lift. I want the truth. Do not make me guess.',
    'On the workout, thumbs are under the photos. Up if it is clean. Down if the video is dead, the picture is a lie, or something else is wrong. Something else means you write it. One vote this session. Next session you can flip.',
    'You do not finish and you do not quit until you score it. One is weak. Five is you want it again. Stay for More and I throw that score in the trash.',
    'Home now shows your numbers next to the household. You see who is ahead. You see who is soft. I already know.',
  ],
  also: [
    'Your enjoyment charts show up on Home once you have scored a session. Empty boards stay hidden. I do not decorate silence.',
    'Hard-refresh. Then get under the bar, man.',
  ],
};
