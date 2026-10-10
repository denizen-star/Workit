import { addEasternCalendarDays, easternMondayKey, easternWeekday, easternYmd } from '@/lib/analyticsTime';
import { parseDbTime } from '@/lib/optionals';

export const STREAK_BREAK_LINE = "One week break is fine. Let's get back to the iron.";

/** Monday only: last Eastern week had no finished workout, but the two weeks before it
 * both did (a back-to-back streak), and nothing finished yet this week. */
export function streakBrokeLastWeek(
  sessions: { is_completed?: unknown; completed_at?: string | null }[],
  now: Date = new Date()
): boolean {
  if (easternWeekday(now) !== 1) return false;
  const days = new Set<string>();
  for (const s of sessions) {
    if (!Number(s.is_completed)) continue;
    const t = parseDbTime(s.completed_at ?? null);
    if (t != null) days.add(easternYmd(new Date(t)));
  }
  const has = (monday: string) => {
    for (let i = 0; i < 7; i++) if (days.has(addEasternCalendarDays(monday, i))) return true;
    return false;
  };
  const thisMonday = easternMondayKey(now);
  const last = addEasternCalendarDays(thisMonday, -7);
  return (
    !has(thisMonday) &&
    !has(last) &&
    has(addEasternCalendarDays(thisMonday, -14)) &&
    has(addEasternCalendarDays(thisMonday, -21))
  );
}
