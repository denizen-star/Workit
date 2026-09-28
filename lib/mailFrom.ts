import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';

/** Visible From addresses. SMTP still logs in as SENDER_EMAIL, and Zoho only lets
 * it send as a registered alias of that mailbox (a group address 553s).
 * Registered aliases: tom@, luna@, grey@, eli.sparks@, workit-info@.
 * Not yet registered: welcome@, news@, help@ — those sends 553 until they are. */
export const MAIL_FROM = {
  tom: 'tom@workitapp.fit',
  luna: 'luna@workitapp.fit',
  grey: 'grey@workitapp.fit',
  eli: 'eli.sparks@workitapp.fit',
  welcome: 'welcome@workitapp.fit',
  news: 'news@workitapp.fit',
  help: 'help@workitapp.fit',
  info: 'workit-info@workitapp.fit',
} as const;

/** Where every send is BCC'd — the info@ group (receiving works; only sending as it 553s). */
export const OPS_BCC_ADDRESS = 'info@workitapp.fit';

const COACH_ADDRESS: Record<CoachTone, string> = {
  master: MAIL_FROM.tom,
  james: MAIL_FROM.grey,
  luna: MAIL_FROM.luna,
  eli: MAIL_FROM.eli,
};

export function coachFromAddress(tone?: CoachTone | null) {
  return COACH_ADDRESS[normalizeCoachTone(tone)];
}

/** Voice for mail that goes out to the whole house at once (release notes,
 * nudges, the six-week pace check, the weekly scoreboard) — one voice for
 * everyone instead of each athlete's own coach. */
export const BROADCAST_TONE: CoachTone = 'eli';
