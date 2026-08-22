/**
 * User-facing release orders from Master Tom Iron.
 * `/document` rewrites this from CHANGELOG Unreleased, then runs `npm run mail:release`.
 * Household tone only — no Netlify, env vars, or admin tooling.
 */
export const CURRENT_RELEASE: {
  version: string;
  title: string;
  wins: string[];
  also: string[];
} = {
  version: '3.0.0',
  title: 'New orders. Obey them.',
  wins: [
    'Open workit.kervinapps.com. Logged out, I send you to the name picker. Logged in, I send you home. Stop arguing with the address bar, man.',
    'Home has a scoreboard now. Folded. Tap it. Seven days, thirty days, or all time. If a body did not finish a workout in that window, they are not on my board.',
    'Twenty new medals. Cartoon plates, not cartoon faces. Finish a session and tap through every badge I just hung on you. Then you get the completion line.',
    'Achievements live at the bottom, folded. Open them when you want to stare. I already know who earned what.',
    'Your last weight and last reps ride with you, every set, for your name only. Stop pretending you forgot what you lifted.',
    'Rest lines are a full bank now. I will not repeat myself until I have used the set. Master Tom Iron or Luna Meadows — pick one in Edit profile and stay in it.',
    'Hanging Knee / Leg Raises and Ab Wheel Rollouts are two videos. Face Pulls got a new one. Watch the form before you embarrass me.',
    'Edit profile scrolls on a phone. Save your voice. Turn sound On. Then I want to hear the chime when you finish, sissy.',
  ],
  also: [
    'Hard-refresh if you are still running the old build. Then get under the bar.',
    'Phone silent switch off. If I still cannot hear you, that is your problem.',
  ],
};
