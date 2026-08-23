import { query } from '@/lib/db';
import { resolveAnalyticsWindow, sqlUtc, type AnalyticsRangeId } from '@/lib/analyticsTime';
import { getExerciseKind, setVolume } from '@/lib/exerciseKind';
import { exerciseCanonicalName, exerciseHistoryKey } from '@/lib/exerciseKey';
import { SQL_EXCLUDE_TEST_USER } from '@/lib/householdUsers';
import { firstName, type ScoreboardPeriod } from '@/lib/scoreboardTypes';

export type CompareMetric = 'weight' | 'reps';

export type ExerciseCompareCell = {
  exerciseName: string;
  value: number;
  unit: 'lb' | 'reps';
  sessionDate: string | null;
  percent: number | null;
  peerName: string | null;
  peerValue: number | null;
  peerSessionDate: string | null;
};

export type ExerciseCompareTrio = {
  lead: ExerciseCompareCell | null;
  deficit: ExerciseCompareCell | null;
  similar: ExerciseCompareCell | null;
};

export type ExerciseCompareRow = {
  userId: number;
  name: string;
  weight: ExerciseCompareTrio;
  reps: ExerciseCompareTrio;
};

export type WeightRank = {
  userId: number;
  name: string;
  rank: number;
  bestDay: number;
  totalWeight: number;
};

export type ExerciseCompareBoard = {
  rows: ExerciseCompareRow[];
  ranking: WeightRank[];
};

export type ExerciseCompareWindow =
  | { kind: 'scoreboard'; period: ScoreboardPeriod }
  | { kind: 'analytics'; range: AnalyticsRangeId };

type BestDay = {
  userId: number;
  name: string;
  score: number;
  sessionDate: string | null;
  sourceName: string;
};

type Movement = {
  key: string;
  displayName: string;
  days: BestDay[];
};

type SessionDay = {
  userId: number;
  name: string;
  sessionDate: string | null;
  sourceName: string;
  weight: number;
  reps: number;
};

function windowFilter(window: ExerciseCompareWindow): { sql: string; params: unknown[] } {
  const col = 'COALESCE(ws.completed_at, ws.started_at, ws.created_at)';
  if (window.kind === 'scoreboard') {
    if (window.period === 'all') return { sql: '', params: [] };
    const days = window.period === '30' ? 30 : 7;
    return { sql: ` AND ${col} >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${days} DAY)`, params: [] };
  }
  if (window.range === 'all') return { sql: '', params: [] };
  const win = resolveAnalyticsWindow(window.range);
  return {
    sql: ` AND ${col} >= ? AND ${col} < ?`,
    params: [sqlUtc(win.rangeStartUtc), sqlUtc(win.rangeEndExclusiveUtc)],
  };
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function coefficientOfVariation(values: number[]): number {
  const avg = mean(values);
  if (avg === 0) return Number.POSITIVE_INFINITY;
  return stdev(values) / avg;
}

/** Same-band peers: within 1 SD of you. Stops a blowout vs someone in another class. */
function comparisonPool(days: BestDay[], you: BestDay): BestDay[] {
  if (days.length < 3) return days;
  const spread = stdev(days.map((day) => day.score));
  if (spread <= 0) return days;
  const band = days.filter((day) => Math.abs(day.score - you.score) <= spread);
  if (band.length >= 2) return band;
  const nearest = days
    .filter((day) => day.userId !== you.userId)
    .sort((a, b) => Math.abs(a.score - you.score) - Math.abs(b.score - you.score))[0];
  return nearest ? [you, nearest] : days;
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

async function loadSessionDays(window: ExerciseCompareWindow): Promise<{
  athletes: { userId: number; name: string }[];
  sessions: SessionDay[];
  volumeByUser: Map<number, number>;
}> {
  const filter = windowFilter(window);

  const [athleteResult, setResult] = await Promise.all([
    query(
      `SELECT DISTINCT u.id, u.name
       FROM users u
       INNER JOIN workout_sessions ws ON ws.user_id = u.id AND ws.is_completed = 1
       WHERE ${SQL_EXCLUDE_TEST_USER} ${filter.sql}
       ORDER BY u.name ASC`,
      filter.params
    ),
    query(
      `SELECT
         u.id as user_id,
         u.name as user_name,
         ws.id as session_id,
         COALESCE(ws.completed_at, ws.started_at, ws.created_at) as session_at,
         es.exercise_name,
         es.target_reps,
         es.weight_lbs,
         es.actual_reps
       FROM exercise_sets es
       INNER JOIN workout_sessions ws ON ws.id = es.workout_session_id
       INNER JOIN users u ON u.id = ws.user_id
       WHERE ws.is_completed = 1
         AND es.is_completed = 1
         AND ${SQL_EXCLUDE_TEST_USER}
         ${filter.sql}`,
      filter.params
    ),
  ]);

  const athletes = (athleteResult.rows as { id: number; name: string }[]).map((row) => ({
    userId: Number(row.id),
    name: row.name,
  }));

  const sessionTotals = new Map<string, SessionDay>();
  const volumeByUser = new Map<number, number>();

  for (const row of setResult.rows as {
    user_id: number;
    user_name: string;
    session_id: number;
    session_at: unknown;
    exercise_name: string;
    target_reps: string | null;
    weight_lbs: number | null;
    actual_reps: number | null;
  }[]) {
    const userId = Number(row.user_id);
    volumeByUser.set(
      userId,
      (volumeByUser.get(userId) || 0) +
        setVolume(row.exercise_name, row.target_reps, row.weight_lbs, row.actual_reps)
    );

    const kind = getExerciseKind(row.exercise_name, row.target_reps || '');
    if (kind === 'timed' || kind === 'distance') continue;

    const weight = Number(row.weight_lbs) || 0;
    const reps = Number(row.actual_reps) || 0;
    const key = exerciseHistoryKey(row.exercise_name);
    const bucket = `${Number(row.user_id)}:${Number(row.session_id)}:${key}`;
    const current = sessionTotals.get(bucket);
    if (current) {
      if (weight > 0) current.weight += weight;
      if (reps > 0) current.reps += reps;
    } else {
      sessionTotals.set(bucket, {
        userId: Number(row.user_id),
        name: row.user_name,
        sessionDate: toIso(row.session_at),
        sourceName: row.exercise_name,
        weight: weight > 0 ? weight : 0,
        reps: reps > 0 ? reps : 0,
      });
    }
  }

  return { athletes, sessions: [...sessionTotals.values()], volumeByUser };
}

function movementsFor(sessions: SessionDay[], metric: CompareMetric): Movement[] {
  const bestByMovement = new Map<string, BestDay[]>();

  for (const day of sessions) {
    const score = metric === 'weight' ? day.weight : day.reps;
    if (score <= 0) continue;
    const key = exerciseHistoryKey(day.sourceName);
    const list = bestByMovement.get(key) || [];
    const existing = list.find((item) => item.userId === day.userId);
    if (!existing || score > existing.score) {
      const next: BestDay = {
        userId: day.userId,
        name: day.name,
        score,
        sessionDate: day.sessionDate,
        sourceName: day.sourceName,
      };
      if (existing) {
        list[list.indexOf(existing)] = next;
      } else {
        list.push(next);
      }
      bestByMovement.set(key, list);
    }
  }

  const movements: Movement[] = [];
  for (const [key, days] of bestByMovement) {
    if (days.length < 2) continue;
    movements.push({
      key,
      displayName: exerciseCanonicalName(days[0].sourceName),
      days,
    });
  }
  return movements;
}

function cellFor(
  movement: Movement,
  you: BestDay,
  unit: 'lb' | 'reps',
  percent: number | null,
  peer: BestDay | null
): ExerciseCompareCell {
  return {
    exerciseName: movement.displayName,
    value: you.score,
    unit,
    sessionDate: you.sessionDate,
    percent,
    peerName: peer ? firstName(peer.name) : null,
    peerValue: peer ? peer.score : null,
    peerSessionDate: peer ? peer.sessionDate : null,
  };
}

function trioForAthlete(
  athlete: { userId: number; name: string },
  movements: Movement[],
  unit: 'lb' | 'reps'
): ExerciseCompareTrio {
  let lead: ExerciseCompareCell | null = null;
  let leadPct = -1;
  let deficit: ExerciseCompareCell | null = null;
  let deficitPct = -1;
  let similar: ExerciseCompareCell | null = null;
  let similarDist = Number.POSITIVE_INFINITY;
  let similarCv = Number.POSITIVE_INFINITY;

  for (const movement of movements) {
    const you = movement.days.find((day) => day.userId === athlete.userId);
    if (!you) continue;

    const pool = comparisonPool(movement.days, you);
    const others = pool
      .filter((day) => day.userId !== athlete.userId)
      .sort((a, b) => b.score - a.score);
    const scores = pool.map((day) => day.score);
    const packMean = mean(scores);
    const packCv = coefficientOfVariation(scores);

    const nextBest = others[0] || null;
    if (nextBest && you.score > nextBest.score) {
      const gap = pct(you.score - nextBest.score, nextBest.score);
      if (gap > leadPct) {
        leadPct = gap;
        lead = cellFor(movement, you, unit, gap, nextBest);
      }
    }

    const packBest = others[0];
    if (packBest && packBest.score > you.score) {
      const gap = pct(packBest.score - you.score, you.score);
      if (gap > deficitPct) {
        deficitPct = gap;
        deficit = cellFor(movement, you, unit, gap, packBest);
      }
    }

    const closest = others
      .slice()
      .sort((a, b) => Math.abs(a.score - you.score) - Math.abs(b.score - you.score))[0];
    if (closest && packMean > 0) {
      const dist = Math.abs(you.score - packMean) / packMean;
      if (dist < similarDist - 1e-9 || (Math.abs(dist - similarDist) < 1e-9 && packCv < similarCv)) {
        similarDist = dist;
        similarCv = packCv;
        similar = cellFor(
          movement,
          you,
          unit,
          pct(Math.abs(you.score - closest.score), closest.score || you.score),
          closest
        );
      }
    }
  }

  return { lead, deficit, similar };
}

function overallWeightRanking(
  athletes: { userId: number; name: string }[],
  sessions: SessionDay[],
  volumeByUser: Map<number, number>
): WeightRank[] {
  const best = new Map<string, { userId: number; name: string; score: number }>();
  for (const day of sessions) {
    if (day.weight <= 0) continue;
    const key = `${day.userId}:${exerciseHistoryKey(day.sourceName)}`;
    const existing = best.get(key);
    if (!existing || day.weight > existing.score) {
      best.set(key, { userId: day.userId, name: day.name, score: day.weight });
    }
  }

  const bestDayByUser = new Map<number, number>();
  for (const item of best.values()) {
    bestDayByUser.set(item.userId, (bestDayByUser.get(item.userId) || 0) + item.score);
  }

  const names = new Map(athletes.map((athlete) => [athlete.userId, athlete.name]));
  const ids = new Set([...bestDayByUser.keys(), ...volumeByUser.keys()]);
  const sorted = [...ids]
    .map((userId) => ({
      userId,
      name: names.get(userId) || sessions.find((day) => day.userId === userId)?.name || 'Athlete',
      bestDay: bestDayByUser.get(userId) || 0,
      totalWeight: volumeByUser.get(userId) || 0,
    }))
    .filter((row) => row.bestDay > 0 || row.totalWeight > 0)
    .sort(
      (a, b) =>
        b.bestDay - a.bestDay || b.totalWeight - a.totalWeight || a.name.localeCompare(b.name)
    );

  let lastBest = Number.NaN;
  let lastRank = 0;
  return sorted.map((row, index) => {
    const rank = row.bestDay === lastBest ? lastRank : index + 1;
    lastBest = row.bestDay;
    lastRank = rank;
    return { ...row, rank };
  });
}

export async function householdExerciseCompare(
  window: ExerciseCompareWindow
): Promise<ExerciseCompareBoard> {
  const { athletes, sessions, volumeByUser } = await loadSessionDays(window);
  const weightMoves = movementsFor(sessions, 'weight');
  const repsMoves = movementsFor(sessions, 'reps');
  return {
    rows: athletes.map((athlete) => ({
      userId: athlete.userId,
      name: athlete.name,
      weight: trioForAthlete(athlete, weightMoves, 'lb'),
      reps: trioForAthlete(athlete, repsMoves, 'reps'),
    })),
    ranking: overallWeightRanking(athletes, sessions, volumeByUser),
  };
}

export async function athleteExerciseCompare(
  userId: number,
  window: ExerciseCompareWindow
): Promise<{ row: ExerciseCompareRow | null; ranking: WeightRank[] }> {
  const board = await householdExerciseCompare(window);
  return {
    row: board.rows.find((row) => row.userId === userId) ?? null,
    ranking: board.ranking,
  };
}

export function formatCompareValue(value: number | null | undefined, unit: 'lb' | 'reps') {
  if (value == null) return null;
  const amount = Math.round(value).toLocaleString();
  return unit === 'reps' ? `${amount} reps` : `${amount} lb`;
}

export function compareSentence(
  kind: 'lead' | 'deficit' | 'similar',
  athleteName: string,
  cell: ExerciseCompareCell | null
): string | null {
  if (!cell) return null;
  const who = firstName(athleteName);
  const lift = cell.exerciseName;
  if (kind === 'lead') {
    return cell.peerName
      ? `${who} leads on ${lift}, closest ${cell.peerName}`
      : `${who} leads on ${lift}`;
  }
  if (kind === 'deficit') {
    return cell.peerName
      ? `${who} is behind ${cell.peerName} on ${lift}`
      : `${who} is behind on ${lift}`;
  }
  return cell.peerName
    ? `${who} is even with ${cell.peerName} on ${lift}`
    : `${who} sits with the pack on ${lift}`;
}

function trioLines(label: string, athleteName: string, trio: ExerciseCompareTrio): string[] {
  const kinds = [
    ['lead', trio.lead],
    ['deficit', trio.deficit],
    ['similar', trio.similar],
  ] as const;
  const lines = [label];
  for (const [kind, cell] of kinds) {
    const sentence = compareSentence(kind, athleteName, cell);
    if (!sentence || !cell) {
      lines.push(kind === 'lead' ? '  —' : kind === 'deficit' ? '  —' : '  —');
      continue;
    }
    const mine = formatCompareValue(cell.value, cell.unit);
    const theirs = formatCompareValue(cell.peerValue, cell.unit);
    const gap = cell.percent != null ? `${cell.percent}%` : null;
    lines.push(`  ${sentence}` + (mine ? ` · ${mine}` : '') + (theirs ? ` · ${theirs}` : '') + (gap ? ` · ${gap}` : ''));
  }
  return lines;
}

export function ordinalRank(rank: number) {
  const teens = rank % 100;
  if (teens >= 11 && teens <= 13) return `${rank}th`;
  const ones = rank % 10;
  if (ones === 1) return `${rank}st`;
  if (ones === 2) return `${rank}nd`;
  if (ones === 3) return `${rank}rd`;
  return `${rank}th`;
}

export function formatK(value: number) {
  const amount = Math.round(value);
  if (Math.abs(amount) < 1000) return String(amount);
  const k = amount / 1000;
  const rounded = Math.round(k * 10) / 10;
  return `${Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)}k`;
}

function pairLine(entry: WeightRank) {
  return `Best day ${formatK(entry.bestDay)} · Total weight ${formatK(entry.totalWeight)}`;
}

export function rankingSummary(ranking: WeightRank[]): string[] {
  return ranking.map((entry) => `${entry.rank}. ${firstName(entry.name)} · ${pairLine(entry)}`);
}

export function overallRankSentence(
  athlete: { userId?: number; name: string },
  ranking: WeightRank[]
): string | null {
  const you =
    athlete.userId != null
      ? ranking.find((entry) => entry.userId === athlete.userId)
      : ranking.find((entry) => entry.name === athlete.name);
  if (!you) return null;
  const who = firstName(athlete.name);
  const pack = ranking.length;
  const yours = pairLine(you);
  if (you.rank === 1) {
    const tied = ranking.filter((entry) => entry.rank === 1).length > 1;
    return tied
      ? `${who} is tied for 1st of ${pack}. ${yours}.`
      : `${who} is 1st of ${pack}. ${yours}.`;
  }
  return `${who} is ${ordinalRank(you.rank)} of ${pack}. ${yours}.`;
}

export function standingSummary(
  row: ExerciseCompareRow | null,
  ranking: WeightRank[] = []
): string[] {
  if (!row) return [];
  const rankLine = overallRankSentence(row, ranking);
  return [
    ...(rankLine ? [rankLine] : []),
    ...trioLines('Weight', row.name, row.weight),
    ...trioLines('Reps', row.name, row.reps),
  ];
}
