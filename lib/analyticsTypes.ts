export const APP_NAME = process.env.APP_NAME ?? 'workit';

export const ALLOWED_EVENT_TYPES = [
  'page_view',
  'page_exit',
  'scroll_depth',
  'who_pick',
  'login',
  'logout',
  'workout_start',
  'workout_resume',
  'workout_restart',
  'workout_complete',
  'workout_mode',
  'set_logged',
  'badge_awarded',
  'profile_edit',
  'admin_page_view',
  'admin_mail',
  'admin_user',
] as const;

export type AnalyticsEventType = (typeof ALLOWED_EVENT_TYPES)[number];

export const ALLOWED_EVENT_TYPE_SET = new Set<string>(ALLOWED_EVENT_TYPES);

export function isProductionAnalytics(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function toMySQLDateTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}
