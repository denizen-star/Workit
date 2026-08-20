export const MAIL_TEMPLATES = [
  'welcome',
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
