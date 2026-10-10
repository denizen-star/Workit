import { query } from '@/lib/db';
import {
  DEFAULT_FOCUSES,
  parseFocuses,
  sameFocuses,
  serializeFocuses,
  type Focus,
  type FocusInfo,
  type Focuses,
} from '@/lib/focus';

/**
 * The athlete's focuses, server side (docs/plans/PLAN_FOCUS_ONBOARDING.md): the default
 * list on `users.focus` plus per-week overrides in `week_focus` (each a comma list, so an
 * athlete can mix focuses). Reads fall back to the Build muscle program when the
 * columns/table are missing (migrate-focus.sql not applied yet), so nothing breaks before
 * the migration lands.
 */
export type FocusState = {
  focuses: Focus[];
  /** Null until the athlete has seen the setup step — gates the one-time Home takeover. */
  chosenAt: string | null;
  /** Weeks the athlete picked different focuses for. */
  weekOverrides: Map<number, Focus[]>;
};

export async function loadFocusState(userId: number): Promise<FocusState> {
  const [user, weeks] = await Promise.all([
    query('SELECT focus, focus_chosen_at FROM users WHERE id = ?', [userId]).catch(() => null),
    query('SELECT week_number, focus FROM week_focus WHERE user_id = ?', [userId]).catch(() => null),
  ]);
  const row = user?.rows[0] as { focus?: string | null; focus_chosen_at?: unknown } | undefined;
  const weekOverrides = new Map<number, Focus[]>();
  for (const item of (weeks?.rows ?? []) as { week_number: number; focus: string }[]) {
    weekOverrides.set(Number(item.week_number), parseFocuses(item.focus));
  }
  return {
    focuses: parseFocuses(row?.focus ?? serializeFocuses(DEFAULT_FOCUSES)),
    chosenAt: row?.focus_chosen_at ? String(row.focus_chosen_at) : null,
    weekOverrides,
  };
}

/** The client-facing shape of the state (sessions payload, /api/focus). */
export async function loadFocusInfo(userId: number): Promise<FocusInfo> {
  const state = await loadFocusState(userId);
  return { focuses: state.focuses, weeks: Object.fromEntries(state.weekOverrides), chosenAt: state.chosenAt };
}

/** `(weekNumber) => Focuses` for the schedule helpers (lib/scheduleDays.ts). */
export async function loadFocusLookup(userId: number): Promise<(weekNumber: number) => Focuses> {
  const state = await loadFocusState(userId);
  return (weekNumber) => state.weekOverrides.get(weekNumber) ?? state.focuses;
}

/** Saves the athlete's default focuses and stamps that they have seen the setup step. */
export async function saveFocus(userId: number, focuses: Focuses): Promise<void> {
  await query('UPDATE users SET focus = ?, focus_chosen_at = COALESCE(focus_chosen_at, UTC_TIMESTAMP()) WHERE id = ?', [
    serializeFocuses(focuses),
    userId,
  ]);
}

/** "Continue as is": stamps the setup step as seen without touching the focuses. */
export async function markFocusSeen(userId: number): Promise<void> {
  await query('UPDATE users SET focus_chosen_at = COALESCE(focus_chosen_at, UTC_TIMESTAMP()) WHERE id = ?', [userId]);
}

/** One week's focuses. Choosing the athlete's own default just clears the override. */
export async function saveWeekFocus(
  userId: number,
  weekNumber: number,
  focuses: Focuses,
  defaults: Focuses
): Promise<void> {
  if (sameFocuses(focuses, defaults)) {
    await query('DELETE FROM week_focus WHERE user_id = ? AND week_number = ?', [userId, weekNumber]);
    return;
  }
  await query(
    `INSERT INTO week_focus (user_id, week_number, focus) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE focus = VALUES(focus)`,
    [userId, weekNumber, serializeFocuses(focuses)]
  );
}

/** True once the athlete has any session (open or finished) in that main-program week. */
export async function weekHasSessions(userId: number, weekNumber: number): Promise<boolean> {
  const result = await query(
    "SELECT 1 FROM workout_sessions WHERE user_id = ? AND week_number = ? AND program_track = 'main' LIMIT 1",
    [userId, weekNumber]
  );
  return result.rows.length > 0;
}
