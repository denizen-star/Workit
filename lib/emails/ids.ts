export const MAIL_TEMPLATES = [
  'welcome',
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
] as const;

export type MailTemplateId = (typeof MAIL_TEMPLATES)[number];
