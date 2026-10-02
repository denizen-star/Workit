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
  'scorecard',
  'schedule_days_ask',
  'onboarding',
] as const;

export type MailTemplateId = (typeof MAIL_TEMPLATES)[number];
