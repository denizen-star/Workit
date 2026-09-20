export const MAIL_TEMPLATES = [
  'welcome',
  'verify',
  'invite',
  'pin_reset',
  'nudge',
  'resume',
  'complete',
  'week',
  'program',
  'badge',
  'belt',
  'scoreboard',
  'release',
  'schedule_days_ask',
] as const;

export type MailTemplateId = (typeof MAIL_TEMPLATES)[number];
