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
  version: '3.1.0',
  title: 'Hotel room. Still work.',
  wins: [
    'Any week. Any day. Open Select Workout, man. Small Gym / Travel switch. Travel is no iron. Floor. Doorframe. Chair. You still train.',
    'Home Start Workout is Gym. I do not ask. Resume is locked to the mode you started. Restart if you want to pick again. A finished day gets no switch. Do Again is Gym.',
    'Travel Survivor is four travel sessions. Not Week 2. Four times you finished without a rack. Earn it.',
  ],
  also: [
    'Trap bar / conventional deadlift has a new form video. Watch it. Then lift.',
    'Hard-refresh if you are still running the old build. Then get under the bar.',
  ],
};
