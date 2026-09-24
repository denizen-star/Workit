import {
  addEasternCalendarDays,
  easternMidnightUtc,
  easternMondayKey,
  sqlUtc,
} from '@/lib/analyticsTime';
import { query } from '@/lib/db';
import { sqlSetEffortVolume } from '@/lib/exerciseKind';
import { compareRank } from '@/lib/rankRule';
import { REQUIRED_DAYS_TO_LOCK } from '@/lib/bonusDay';
import { isTestUserName, SQL_EXCLUDE_TEST_USER } from '@/lib/householdUsers';
import { sqlUserOptionalVolume } from '@/lib/optionals';
import { workoutDateKey } from '@/lib/statsHousehold';

export const WEEK_PODIUM_BACKFILL = 2;

export type WeekPlace = 1 | 2 | 3;

export type WeekPodiumRow = {
  weekMonday: string;
  place: WeekPlace;
  userId: number;
  name: string;
  workouts: number;
  volume: number;
};

export type WeekPodiumYou = {
  weekMonday: string;
  place: WeekPlace;
};

export type WeekMissYou = {
  weekMonday: string;
  workouts: number;
  line: string;
};

/** Mondays of Eastern weeks whose Sunday has already ended. Current week is never included. */
export function closedMondayKeys(count = WEEK_PODIUM_BACKFILL, now = new Date()): string[] {
  const currentMonday = easternMondayKey(now);
  const keys: string[] = [];
  for (let i = 1; i <= count; i++) {
    keys.push(addEasternCalendarDays(currentMonday, -7 * i));
  }
  return keys;
}

export function lastClosedMonday(now = new Date()): string | null {
  return closedMondayKeys(1, now)[0] || null;
}

export function weekWindowUtc(monday: string): { startUtc: string; endUtc: string } {
  const nextMonday = addEasternCalendarDays(monday, 7);
  return {
    startUtc: sqlUtc(easternMidnightUtc(monday)),
    endUtc: sqlUtc(easternMidnightUtc(nextMonday)),
  };
}

export function isWeekPlace(value: unknown): value is WeekPlace {
  return value === 1 || value === 2 || value === 3;
}

export function placeWord(place: WeekPlace) {
  if (place === 1) return '1st';
  if (place === 2) return '2nd';
  return '3rd';
}

export function medalLabel(place: WeekPlace) {
  if (place === 1) return 'Gold';
  if (place === 2) return 'Silver';
  return 'Bronze';
}

export function formatWeekMonday(monday: string) {
  const date = new Date(`${monday}T12:00:00`);
  if (Number.isNaN(date.getTime())) return monday;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function sessionStampSql(alias = 'ws') {
  return `COALESCE(${alias}.completed_at, ${alias}.started_at, ${alias}.created_at)`;
}

function windowSql(alias: string) {
  return ` AND ${sessionStampSql(alias)} >= ? AND ${sessionStampSql(alias)} < ?`;
}

export async function rankClosedWeek(monday: string): Promise<WeekPodiumRow[]> {
  const { startUtc, endUtc } = weekWindowUtc(monday);
  const bounds = [startUtc, endUtc];
  const sessionWindow = windowSql('ws');
  const optionalWindow = windowSql('optws');

  // Medals use the house rank rule (lib/rankRule.ts): met your own weekly day count
  // first, then average display volume per session — effort sets + optional lbs +
  // Your pick credit. Weeks already written to week_podium keep their old places.
  const result = await query(
    `SELECT
       u.id,
       u.name,
       u.schedule_days_per_week,
       COUNT(DISTINCT ws.id) as workouts,
       COALESCE(SUM(${sqlSetEffortVolume('es')}), 0) + ${sqlUserOptionalVolume(
         'u.id',
         `AND optws.is_completed = 1${optionalWindow}`,
         'optws'
       )} as volume
     FROM users u
     INNER JOIN workout_sessions ws
       ON ws.user_id = u.id AND ws.is_completed = 1 ${sessionWindow}
     LEFT JOIN exercise_sets es ON es.workout_session_id = ws.id AND es.is_completed = 1
     WHERE ${SQL_EXCLUDE_TEST_USER}
     GROUP BY u.id, u.name, u.schedule_days_per_week
     HAVING COUNT(DISTINCT ws.id) > 0`,
    [...bounds, ...bounds]
  );

  const rows = result.rows as {
    id: number;
    name: string;
    schedule_days_per_week: number | null;
    workouts: number;
    volume: number;
  }[];
  if (rows.length === 0) return [];

  return rows
    .map((row) => ({
      id: Number(row.id),
      name: row.name,
      workouts: Number(row.workouts || 0),
      volume: Number(row.volume || 0),
      scheduleDays: row.schedule_days_per_week,
    }))
    .sort((a, b) => compareRank(a, b, 7))
    .slice(0, 3)
    .map((row, index) => ({
      weekMonday: monday,
      place: (index + 1) as WeekPlace,
      userId: row.id,
      name: row.name,
      workouts: row.workouts,
      volume: row.volume,
    }));
}

function isMissingPodiumTable(error: unknown) {
  const message = String(error instanceof Error ? error.message : error);
  return /week_podium/i.test(message) && /exist|unknown table/i.test(message);
}

async function weekHasRows(monday: string) {
  const existing = await query('SELECT id FROM week_podium WHERE week_monday = ? LIMIT 1', [monday]);
  return existing.rows.length > 0;
}

async function insertPodium(rows: WeekPodiumRow[]) {
  for (const row of rows) {
    await query(
      `INSERT IGNORE INTO week_podium (week_monday, place, user_id, workouts, volume)
       VALUES (?, ?, ?, ?, ?)`,
      [row.weekMonday, row.place, row.userId, row.workouts, row.volume]
    );
  }
}

/** Persist 1/2/3 for any closed week that has no rows yet. First call fills the last two closed Sundays. */
export async function ensureClosedWeekPodiums(now = new Date()): Promise<void> {
  try {
    for (const monday of closedMondayKeys(WEEK_PODIUM_BACKFILL, now)) {
      if (await weekHasRows(monday)) continue;
      const ranked = await rankClosedWeek(monday);
      if (ranked.length === 0) continue;
      await insertPodium(ranked);
    }
  } catch (error) {
    if (isMissingPodiumTable(error)) {
      console.warn('[week-podium] table missing; apply database/migrate-week-podium.sql');
      return;
    }
    throw error;
  }
}

function asPodiumRow(row: {
  week_monday: unknown;
  place: number;
  user_id: number;
  name?: string;
  workouts: number;
  volume: number;
}): WeekPodiumRow {
  return {
    weekMonday: workoutDateKey(row.week_monday),
    place: (Number(row.place) as WeekPlace) || 1,
    userId: Number(row.user_id),
    name: row.name || '',
    workouts: Number(row.workouts || 0),
    volume: Number(row.volume || 0),
  };
}

export async function loadWeekPodium(monday: string): Promise<WeekPodiumRow[]> {
  try {
    const result = await query(
      `SELECT wp.week_monday, wp.place, wp.user_id, u.name, wp.workouts, wp.volume
       FROM week_podium wp
       INNER JOIN users u ON u.id = wp.user_id
       WHERE wp.week_monday = ?
       ORDER BY wp.place ASC`,
      [monday]
    );
    return (result.rows as Parameters<typeof asPodiumRow>[0][]).map(asPodiumRow);
  } catch (error) {
    if (isMissingPodiumTable(error)) return [];
    throw error;
  }
}

export type WeekMedalCountRow = {
  userId: number;
  name: string;
  gold: number;
  silver: number;
  bronze: number;
};

/** All-time weekly medal counts. Test out. Athletes with zero medals stay off the list. */
export async function loadWeekMedalCounts(): Promise<WeekMedalCountRow[]> {
  try {
    const result = await query(
      `SELECT
         u.id,
         u.name,
         SUM(CASE WHEN wp.place = 1 THEN 1 ELSE 0 END) as gold,
         SUM(CASE WHEN wp.place = 2 THEN 1 ELSE 0 END) as silver,
         SUM(CASE WHEN wp.place = 3 THEN 1 ELSE 0 END) as bronze
       FROM week_podium wp
       INNER JOIN users u ON u.id = wp.user_id
       WHERE ${SQL_EXCLUDE_TEST_USER}
       GROUP BY u.id, u.name
       HAVING SUM(CASE WHEN wp.place IN (1, 2, 3) THEN 1 ELSE 0 END) > 0
       ORDER BY gold DESC, silver DESC, bronze DESC, u.name ASC`
    );
    return (result.rows as { id: number; name: string; gold: number; silver: number; bronze: number }[]).map(
      (row) => ({
        userId: Number(row.id),
        name: row.name,
        gold: Number(row.gold || 0),
        silver: Number(row.silver || 0),
        bronze: Number(row.bronze || 0),
      })
    );
  } catch (error) {
    if (isMissingPodiumTable(error)) return [];
    throw error;
  }
}

/** Finished sessions in a closed Eastern Mon–Sun week. Same window as the podium. */
export async function countUserClosedWeekWorkouts(userId: number, monday: string): Promise<number> {
  const { startUtc, endUtc } = weekWindowUtc(monday);
  const result = await query(
    `SELECT COUNT(*) as n
     FROM workout_sessions ws
     WHERE ws.user_id = ? AND ws.is_completed = 1 ${windowSql('ws')}`,
    [userId, startUtc, endUtc]
  );
  return Number((result.rows[0] as { n: number } | undefined)?.n || 0);
}

export function missedTheWeek(workouts: number, requiredCount = REQUIRED_DAYS_TO_LOCK) {
  return workouts < requiredCount;
}

/**
 * A brand-new account can't have "missed" a week that closed before they joined.
 * True only when the account existed before that week's Monday started.
 */
export function accountExistedBeforeWeek(
  createdAt: string | Date | null | undefined,
  monday: string
): boolean {
  if (!createdAt) return true;
  const { startUtc } = weekWindowUtc(monday);
  return new Date(String(createdAt)).getTime() < new Date(startUtc).getTime();
}

export type WeekTakeoverKind = 'podium' | 'miss';

function isMissingSeenTable(error: unknown) {
  const message = String(error instanceof Error ? error.message : error);
  return /week_takeover_seen/i.test(message) && /exist|unknown table/i.test(message);
}

/**
 * Has this user already dismissed the podium/miss takeover for this week? Server-side
 * (keyed by account, not device) so it doesn't reappear on a different browser or PWA-vs-browser.
 */
export async function hasSeenWeekTakeover(
  userId: number,
  weekMonday: string,
  kind: WeekTakeoverKind
): Promise<boolean> {
  try {
    const result = await query(
      'SELECT id FROM week_takeover_seen WHERE user_id = ? AND week_monday = ? AND kind = ? LIMIT 1',
      [userId, weekMonday, kind]
    );
    return result.rows.length > 0;
  } catch (error) {
    if (isMissingSeenTable(error)) return false;
    throw error;
  }
}

export async function markWeekTakeoverSeen(
  userId: number,
  weekMonday: string,
  kind: WeekTakeoverKind
): Promise<void> {
  try {
    await query(
      `INSERT IGNORE INTO week_takeover_seen (user_id, week_monday, kind) VALUES (?, ?, ?)`,
      [userId, weekMonday, kind]
    );
  } catch (error) {
    if (isMissingSeenTable(error)) return;
    throw error;
  }
}

export async function loadUserWeekMedals(userId: number, userName: string): Promise<WeekPodiumYou[]> {
  if (isTestUserName(userName)) return [];
  try {
    const result = await query(
      `SELECT week_monday, place
       FROM week_podium
       WHERE user_id = ?
       ORDER BY week_monday DESC`,
      [userId]
    );
    return (result.rows as { week_monday: unknown; place: number }[])
      .filter((row) => isWeekPlace(Number(row.place)))
      .map((row) => ({
        weekMonday: workoutDateKey(row.week_monday),
        place: Number(row.place) as WeekPlace,
      }));
  } catch (error) {
    if (isMissingPodiumTable(error)) return [];
    throw error;
  }
}
