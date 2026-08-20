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
  version: '2.0.0',
  title: 'I mail you now',
  wins: [
    "You're mine. Invitation only. When I put you on the roster, I mail you. No excuse that you did not know.",
    'Put Work-It on your iPhone home screen. Safari. Share. Add to Home Screen. Browser tabs are for men who go soft.',
    'Training days I wake you up. Leave a session open and I drag you back under the bar.',
    'You finish, I recap. Time, volume, sweat, what you owe me next. Badges are praise you earn.',
    'You answer to Master Workit. I call you man. Obey.',
  ],
  also: [
    'Hard-refresh if you are still running the old build. Then get under the bar.',
  ],
};
