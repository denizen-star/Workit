export const MAIL_TEMPLATES = [
  'welcome',
  'invite',
  'nudge',
  'resume',
  'complete',
  'week',
  'program',
  'badge',
  'scoreboard',
  'release',
] as const;

export type MailTemplateId = (typeof MAIL_TEMPLATES)[number];
