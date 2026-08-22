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
  version: '2.0.1',
  title: 'Come in through the door',
  wins: [
    'Every mail I send you opens on the name picker. Pick your name. Punch your PIN. That is how you come in, sissy.',
    'The house is workit.kervinapps.com. No hyphen. Bookmark that. The other door is dead.',
    'Hard-refresh if you are still running the old build. Then get under the bar.',
  ],
  also: [
    'Old mail with a dead link? Throw it out. Use the button in this one.',
  ],
};
