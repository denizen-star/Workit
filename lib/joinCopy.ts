export const JOIN_INTRO_TITLE = 'Join the movement';

export const JOIN_INTRO_LEAD =
  'Work-It is the year, already written. You show up. You log the work. You do not invent the session on the fly. We thought it through and planned it for you.';

export const JOIN_INTRO_BULLETS = [
  'Four days lock a week. That is the bar.',
  'Gold means go. Start. Log the set. Finish it.',
  'Your numbers stay on your name.',
  'Email and a four-digit PIN. Same phone keeps you in.',
] as const;

export const EMAIL_NOT_VERIFIED = 'That email has not been verified. Open the mail we sent, then come back.';

/** /join agree screen (between intro and form). Neutral, near-legal; the formal terms stay in lib/waiver.ts. */
export const JOIN_AGREE_TITLE = 'Before you join';

export const JOIN_AGREE_SECTIONS = [
  { heading: '18+ only.', body: 'You must be 18 or older to use Work-It.' },
  {
    heading: 'Your risk.',
    body: 'Workouts and weights are suggestions only. Know your injuries and health limits. Train at your own pace and at your own risk.',
  },
] as const;

export const JOIN_AGREE_CONFIRM = 'I confirm';
export const JOIN_AGREE_PASS = 'Under 18 / Pass';
