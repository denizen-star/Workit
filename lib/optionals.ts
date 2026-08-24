import { query } from '@/lib/db';
import { sqlSetVolume } from '@/lib/exerciseKind';
import { SQL_EXCLUDE_TEST_USER } from '@/lib/householdUsers';
import { type ScoreboardPeriod } from '@/lib/scoreboardTypes';

export const OPTIONAL_SLOT_LBS = 500;
export const OPTIONAL_SECONDS = 10 * 60;
export const OPTIONAL_KICKER_RATE = 0.25;
export const OPTIONAL_WEEK_SLOTS = 4;

export type OptionalSlot = 'warmup' | 'cooldown';
export type OptionalTrack = 'run' | 'bike' | 'stretch' | 'core';

export type OptionalCircuitStep = {
  title: string;
  body: string;
  /** Suggested hold. Stretch and core only. */
  holdSeconds?: number;
  /** free-exercise-db start/end stills. Stretch and core only. */
  start?: string;
  end?: string;
  videoId?: string;
};

const FED = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

function stills(id: string) {
  return {
    start: `${FED}/${id}/0.jpg`,
    end: `${FED}/${id}/1.jpg`,
  };
}

const TRACKS: OptionalTrack[] = ['run', 'bike', 'stretch', 'core'];

const TRACK_LABELS: Record<OptionalTrack, string> = {
  run: 'Easy run',
  bike: 'Easy bike',
  stretch: 'Easy stretch',
  core: 'Easy core',
};

function guided(
  title: string,
  body: string,
  id: string,
  videoId: string,
  holdSeconds: number
): OptionalCircuitStep {
  return { title, body, holdSeconds, videoId, ...stills(id) };
}

/** Easy circuits. Run/bike cues rotate until 10 minutes. Stretch/core are five holds; Done on the last hold credits +500 without waiting out the clock. */
const CIRCUITS: Record<OptionalSlot, Record<OptionalTrack, OptionalCircuitStep[]>> = {
  warmup: {
    run: [
      { title: 'Easy jog', body: 'Soft pace. You could talk the whole time.' },
      { title: 'Tall posture', body: 'Head up, shoulders quiet. Let the arms swing.' },
      { title: 'Easy breath', body: 'In through the nose if you can. Nothing heroic.' },
    ],
    bike: [
      { title: 'Easy spin', body: 'Light gear. Legs turn without a fight.' },
      { title: 'Loose shoulders', body: 'Unclench the hands. Drop the neck.' },
      { title: 'Easy breath', body: 'Smooth in, smooth out. Stay unhurried.' },
    ],
    stretch: [
      guided(
        'Neck',
        'Slow look left and right. Switch sides halfway. No forcing.',
        'Side_Neck_Stretch',
        'was4RtzpfJs',
        45
      ),
      guided(
        'Shoulders',
        'Roll them back. Open the chest a little.',
        'Shoulder_Circles',
        'NS64IgKUyeY',
        45
      ),
      guided(
        'Chest',
        'Hands on a wall or behind you. Open without a fight.',
        'Chest_And_Front_Of_Shoulder_Stretch',
        'NS64IgKUyeY',
        45
      ),
      guided(
        'Hips',
        'Easy side lunge or a gentle fold. Switch sides halfway.',
        'Groiners',
        'YQmpO9VT2X4',
        60
      ),
      guided(
        'Calves',
        'Heel down, knee soft. Switch sides halfway.',
        'Standing_Gastrocnemius_Calf_Stretch',
        'i1eJqJ3v3lQ',
        45
      ),
    ],
    core: [
      guided(
        'Dead bug',
        'Back stays on the floor. Slow opposite arm and leg.',
        'Dead_Bug',
        '4XLEnwUr1d8',
        60
      ),
      guided(
        'Easy plank',
        'Knees down is fine. Breathe. Hold a quiet shape.',
        'Plank',
        'ASdvN_XEl_c',
        45
      ),
      guided(
        'Heel taps',
        'Knees bent, tap one heel then the other. Soft.',
        'Alternate_Heel_Touchers',
        '9bR-elyolBQ',
        45
      ),
      guided(
        'Glute bridge',
        'Easy squeeze at the top. No rush.',
        'Butt_Lift_Bridge',
        'X_IGw8U_e38',
        45
      ),
      guided(
        'Superman',
        'Chest lifts a little. Soft neck. Easy.',
        'Superman',
        'cc6UVRS7PW4',
        45
      ),
    ],
  },
  cooldown: {
    run: [
      { title: 'Walk it down', body: 'Jog or walk. Let the heart come home.' },
      { title: 'Shake the legs', body: 'Loose ankles, loose knees. Nothing left to prove.' },
      { title: 'Easy breath', body: 'Longer exhales. You already did the work.' },
    ],
    bike: [
      { title: 'Easy spin', body: 'Softer than the warmup. Let the legs empty.' },
      { title: 'Unclench', body: 'Hands, jaw, shoulders. All of it can go.' },
      { title: 'Slow the legs', body: 'Cadence drops. You are cooling, not chasing.' },
    ],
    stretch: [
      guided(
        'Hamstrings',
        'Easy fold or a long sit. Soft knees. No yanking.',
        'Seated_Floor_Hamstring_Stretch',
        'wr_8aak4Wbc',
        60
      ),
      guided(
        'Quads',
        'Stand or lie on your side. Switch sides halfway.',
        'Quad_Stretch',
        'BhQimqvU1tM',
        45
      ),
      guided(
        'Chest',
        'Hands behind you or on a wall. Open without a fight.',
        'Chest_And_Front_Of_Shoulder_Stretch',
        'NS64IgKUyeY',
        45
      ),
      guided(
        'Hips',
        'A gentle figure-four or a long lunge. Switch sides halfway.',
        'Lying_Glute',
        '0_zPqA65Nok',
        60
      ),
      guided(
        'Calves',
        'Heel down. Switch sides halfway. Let the legs empty.',
        'Standing_Gastrocnemius_Calf_Stretch',
        'i1eJqJ3v3lQ',
        45
      ),
    ],
    core: [
      guided(
        'Dead bug',
        'Slower than the warmup. Floor is a friend.',
        'Dead_Bug',
        '4XLEnwUr1d8',
        60
      ),
      guided(
        'Easy crunch',
        'Small range. Exhale as you lift. Stop while it is kind.',
        'Crunches',
        'RUNrHkbP4Pc',
        45
      ),
      guided(
        'Glute bridge',
        'Easy squeeze. Then let the floor take you.',
        'Butt_Lift_Bridge',
        'X_IGw8U_e38',
        45
      ),
      guided(
        'Cat-cow',
        'Round and arch with the breath. Nothing heroic.',
        'Cat_Stretch',
        'y39PrKY_4JM',
        45
      ),
      guided(
        'Breathe down',
        "Child's pose or on your back, hands on ribs. Long easy breaths.",
        'Childs_Pose',
        'eqVMAPM00DM',
        60
      ),
    ],
  },
};

export function isOptionalSlot(value: unknown): value is OptionalSlot {
  return value === 'warmup' || value === 'cooldown';
}

export function isOptionalTrack(value: unknown): value is OptionalTrack {
  return TRACKS.includes(value as OptionalTrack);
}

export function optionalTracks(): OptionalTrack[] {
  return TRACKS;
}

export function optionalTrackLabel(track: OptionalTrack) {
  return TRACK_LABELS[track];
}

export function optionalSlotLabel(slot: OptionalSlot) {
  return slot === 'warmup' ? 'Warmup' : 'Cooldown';
}

export function optionalCircuit(slot: OptionalSlot, track: OptionalTrack): OptionalCircuitStep[] {
  return CIRCUITS[slot][track];
}

export function isGuidedOptionalTrack(track: OptionalTrack | null | undefined) {
  return track === 'stretch' || track === 'core';
}

export function optionalHoldSeconds(step: OptionalCircuitStep | null | undefined) {
  return Math.max(0, Number(step?.holdSeconds || 0));
}

/** Run/bike cues rotate every 90 seconds until time is up. Stretch/core use tap-to-complete. */
export function optionalCircuitStep(
  slot: OptionalSlot,
  track: OptionalTrack,
  elapsedSeconds: number
): OptionalCircuitStep {
  const steps = optionalCircuit(slot, track);
  const index = Math.floor(Math.max(0, elapsedSeconds) / 90) % steps.length;
  return steps[index];
}

export function sessionOptionalLbs(session: {
  warmup_lbs?: number | null;
  cooldown_lbs?: number | null;
  optional_kicker_lbs?: number | null;
}) {
  return (
    Number(session.warmup_lbs || 0) +
    Number(session.cooldown_lbs || 0) +
    Number(session.optional_kicker_lbs || 0)
  );
}

/** One session row, for SUM() without multiplying through exercise_sets. */
export function sqlSessionOptionalVolume(alias = 'ws'): string {
  return `(COALESCE(${alias}.warmup_lbs, 0) + COALESCE(${alias}.cooldown_lbs, 0) + COALESCE(${alias}.optional_kicker_lbs, 0))`;
}

/** Correlated SUM so a JOIN to exercise_sets cannot multiply Optional lbs. */
export function sqlUserOptionalVolume(userRef: string, extraWhere = '', alias = 'optws'): string {
  return `COALESCE((
    SELECT SUM(${sqlSessionOptionalVolume(alias)})
    FROM workout_sessions ${alias}
    WHERE ${alias}.user_id = ${userRef}
    ${extraWhere}
  ), 0)`;
}

export function parseDbTime(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isNaN(t) ? null : t;
  }
  const raw = String(value).trim();
  if (!raw) return null;
  const stamped =
    /z$/i.test(raw) || /[+-]\d{2}:\d{2}$/.test(raw) ? raw : `${raw.replace(' ', 'T')}Z`;
  const t = new Date(stamped).getTime();
  return Number.isNaN(t) ? null : t;
}

export function optionalElapsedSeconds(startedAt: string | Date | null | undefined, now = Date.now()) {
  const started = parseDbTime(startedAt);
  if (started == null) return 0;
  return Math.max(0, Math.floor((now - started) / 1000));
}

export function optionalRemainingSeconds(startedAt: string | Date | null | undefined, now = Date.now()) {
  return Math.max(0, OPTIONAL_SECONDS - optionalElapsedSeconds(startedAt, now));
}

export function optionalTimerReady(startedAt: string | Date | null | undefined, now = Date.now()) {
  return optionalElapsedSeconds(startedAt, now) >= OPTIONAL_SECONDS;
}

type SessionOptionalRow = {
  week_number?: number | null;
  warmup_completed_at?: string | Date | null;
  cooldown_completed_at?: string | Date | null;
};

export function sessionWarmupDone(session: SessionOptionalRow) {
  return Boolean(session.warmup_completed_at);
}

export function sessionCooldownDone(session: SessionOptionalRow) {
  return Boolean(session.cooldown_completed_at);
}

export function optionalSlotCount(sessions: SessionOptionalRow[]) {
  let warmups = 0;
  let cooldowns = 0;
  for (const session of sessions) {
    if (sessionWarmupDone(session)) warmups += 1;
    if (sessionCooldownDone(session)) cooldowns += 1;
  }
  return { warmups, cooldowns, total: warmups + cooldowns };
}

export function optionalCountInWeek(sessions: SessionOptionalRow[], weekNumber: number) {
  return optionalSlotCount(
    sessions.filter((session) => Number(session.week_number) === weekNumber)
  );
}

/** Unique program weeks with at least 4 warmups and 4 cooldowns. */
export function optionalWeekCount(sessions: SessionOptionalRow[]) {
  const byWeek = new Map<number, { warmups: number; cooldowns: number }>();
  for (const session of sessions) {
    const week = Number(session.week_number);
    if (!week) continue;
    const current = byWeek.get(week) || { warmups: 0, cooldowns: 0 };
    if (sessionWarmupDone(session)) current.warmups += 1;
    if (sessionCooldownDone(session)) current.cooldowns += 1;
    byWeek.set(week, current);
  }
  let count = 0;
  for (const row of byWeek.values()) {
    if (row.warmups >= OPTIONAL_WEEK_SLOTS && row.cooldowns >= OPTIONAL_WEEK_SLOTS) count += 1;
  }
  return count;
}

export function kickerLbs(myTotal: number, leaderTotal: number) {
  const gap = Math.max(0, leaderTotal - myTotal);
  return Math.round(gap * OPTIONAL_KICKER_RATE);
}

const SEVEN_DAY_SQL = 'DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)';

function periodStartSql(period: ScoreboardPeriod, column: string) {
  if (period === 'all') return '';
  const days = period === '30' ? 30 : 7;
  return ` AND ${column} >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${days} DAY)`;
}

export async function householdOptionalHonor(period: ScoreboardPeriod) {
  const warmupWindow = periodStartSql(period, 'ws.warmup_completed_at');
  const cooldownWindow = periodStartSql(period, 'ws.cooldown_completed_at');
  const result = await query(
    `SELECT
       u.id,
       u.name,
       COUNT(*) as optional_weeks
     FROM (
       SELECT
         ws.user_id,
         ws.week_number
       FROM workout_sessions ws
       GROUP BY ws.user_id, ws.week_number
       HAVING SUM(CASE WHEN ws.warmup_completed_at IS NOT NULL ${warmupWindow} THEN 1 ELSE 0 END) >= ${OPTIONAL_WEEK_SLOTS}
          AND SUM(CASE WHEN ws.cooldown_completed_at IS NOT NULL ${cooldownWindow} THEN 1 ELSE 0 END) >= ${OPTIONAL_WEEK_SLOTS}
     ) weeks
     INNER JOIN users u ON u.id = weeks.user_id
     WHERE ${SQL_EXCLUDE_TEST_USER}
     GROUP BY u.id, u.name
     ORDER BY optional_weeks DESC, u.name ASC`
  );

  return (result.rows as { id: number; name: string; optional_weeks: number }[]).map((row) => ({
    id: Number(row.id),
    name: row.name,
    optionalWeeks: Number(row.optional_weeks || 0),
  }));
}

async function sevenDayIronByUser() {
  const result = await query(
    `SELECT ws.user_id, COALESCE(SUM(${sqlSetVolume('es')}), 0) as volume
     FROM workout_sessions ws
     INNER JOIN users u ON u.id = ws.user_id
     LEFT JOIN exercise_sets es ON es.workout_session_id = ws.id AND es.is_completed = 1
     WHERE ws.is_completed = 1
       AND ${SQL_EXCLUDE_TEST_USER}
       AND COALESCE(ws.completed_at, ws.started_at, ws.created_at) >= ${SEVEN_DAY_SQL}
     GROUP BY ws.user_id`
  );
  const map = new Map<number, number>();
  for (const row of result.rows as { user_id: number; volume: number }[]) {
    map.set(Number(row.user_id), Number(row.volume || 0));
  }
  return map;
}

async function sevenDayOptionalByUser() {
  const result = await query(
    `SELECT ws.user_id, COALESCE(SUM(${sqlSessionOptionalVolume('ws')}), 0) as volume
     FROM workout_sessions ws
     INNER JOIN users u ON u.id = ws.user_id
     WHERE ${SQL_EXCLUDE_TEST_USER}
       AND (
         ws.warmup_completed_at >= ${SEVEN_DAY_SQL}
         OR ws.cooldown_completed_at >= ${SEVEN_DAY_SQL}
         OR COALESCE(ws.completed_at, ws.started_at, ws.created_at) >= ${SEVEN_DAY_SQL}
       )
     GROUP BY ws.user_id`
  );
  const map = new Map<number, number>();
  for (const row of result.rows as { user_id: number; volume: number }[]) {
    map.set(Number(row.user_id), Number(row.volume || 0));
  }
  return map;
}

async function userSevenDayVolume(userId: number) {
  const iron = await query(
    `SELECT COALESCE(SUM(${sqlSetVolume('es')}), 0) as volume
     FROM workout_sessions ws
     LEFT JOIN exercise_sets es ON es.workout_session_id = ws.id AND es.is_completed = 1
     WHERE ws.user_id = ?
       AND ws.is_completed = 1
       AND COALESCE(ws.completed_at, ws.started_at, ws.created_at) >= ${SEVEN_DAY_SQL}`,
    [userId]
  );
  const optional = await query(
    `SELECT COALESCE(SUM(${sqlSessionOptionalVolume('ws')}), 0) as volume
     FROM workout_sessions ws
     WHERE ws.user_id = ?
       AND (
         ws.warmup_completed_at >= ${SEVEN_DAY_SQL}
         OR ws.cooldown_completed_at >= ${SEVEN_DAY_SQL}
         OR COALESCE(ws.completed_at, ws.started_at, ws.created_at) >= ${SEVEN_DAY_SQL}
       )`,
    [userId]
  );
  return (
    Number((iron.rows[0] as { volume: number } | undefined)?.volume || 0) +
    Number((optional.rows[0] as { volume: number } | undefined)?.volume || 0)
  );
}

async function slotCountsInSevenDays(userId: number) {
  const result = await query(
    `SELECT
       SUM(CASE WHEN warmup_completed_at >= ${SEVEN_DAY_SQL} THEN 1 ELSE 0 END) as warmups,
       SUM(CASE WHEN cooldown_completed_at >= ${SEVEN_DAY_SQL} THEN 1 ELSE 0 END) as cooldowns
     FROM workout_sessions
     WHERE user_id = ?`,
    [userId]
  );
  const row = result.rows[0] as { warmups: number; cooldowns: number } | undefined;
  return {
    warmups: Number(row?.warmups || 0),
    cooldowns: Number(row?.cooldowns || 0),
  };
}

async function kickerAlreadyAwarded(userId: number) {
  const result = await query(
    `SELECT id FROM workout_sessions
     WHERE user_id = ?
       AND optional_kicker_at IS NOT NULL
       AND optional_kicker_at >= ${SEVEN_DAY_SQL}
     LIMIT 1`,
    [userId]
  );
  return result.rows.length > 0;
}

/**
 * First 4+4 in the 7-day Scoreboard window: 25% of the remaining gap to the
 * household total-weight lead. Freeze even when the kicker is 0.
 */
export async function awardOptionalKicker(userId: number, sessionId: number): Promise<number> {
  if (await kickerAlreadyAwarded(userId)) return 0;

  const counts = await slotCountsInSevenDays(userId);
  if (counts.warmups < OPTIONAL_WEEK_SLOTS || counts.cooldowns < OPTIONAL_WEEK_SLOTS) {
    return 0;
  }

  const [iron, optional, myTotal] = await Promise.all([
    sevenDayIronByUser(),
    sevenDayOptionalByUser(),
    userSevenDayVolume(userId),
  ]);
  const totals = new Map<number, number>();
  for (const [id, value] of iron) totals.set(id, value);
  for (const [id, value] of optional) {
    totals.set(id, (totals.get(id) || 0) + value);
  }
  totals.set(userId, myTotal);

  let leaderTotal = 0;
  for (const value of totals.values()) {
    if (value > leaderTotal) leaderTotal = value;
  }
  const awarded = kickerLbs(myTotal, leaderTotal);

  await query(
    `UPDATE workout_sessions
     SET optional_kicker_lbs = ?, optional_kicker_at = NOW()
     WHERE id = ? AND user_id = ?`,
    [awarded, sessionId, userId]
  );

  return awarded;
}
