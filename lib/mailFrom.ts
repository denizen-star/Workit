import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';

/** Visible From addresses. SMTP still logs in as SENDER_EMAIL. */
export const MAIL_FROM = {
  tom: 'tom@workitapp.fit',
  luna: 'luna@workitapp.fit',
  grey: 'grey@workitapp.fit',
  eli: 'eli@workitapp.fit',
  welcome: 'welcome@workitapp.fit',
  news: 'news@workitapp.fit',
  help: 'help@workitapp.fit',
  info: 'info@workitapp.fit',
} as const;

const COACH_ADDRESS: Record<CoachTone, string> = {
  master: MAIL_FROM.tom,
  james: MAIL_FROM.grey,
  luna: MAIL_FROM.luna,
  eli: MAIL_FROM.eli,
};

export function coachFromAddress(tone?: CoachTone | null) {
  return COACH_ADDRESS[normalizeCoachTone(tone)];
}
