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
  version: '3.2.0',
  title: 'I see you now.',
  wins: [
    'You tap a name. You log a set. You pick Gym or Travel. I see it, man. No hiding behind a quiet week.',
    'You finish, I know who finished. You back out at the PIN, I still know who you reached for. Report in like you mean it.',
    'Hard-refresh. Then get under the bar. I am watching the next session, not your excuses.',
  ],
  also: [
    'Same program. Same PIN. Same coach in your ear. The only new thing is I do not miss a tap.',
  ],
};
