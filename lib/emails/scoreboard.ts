import { query } from '@/lib/db';
import { householdExerciseCompare, rankingSummary, standingSummary } from '@/lib/exerciseCompare';
import { sqlSetVolume } from '@/lib/exerciseKind';
import { isTestUserName, SQL_NOT_BLOCKED_USER, SQL_NOT_JOIN_DRAFT } from '@/lib/householdUsers';
import { householdOptionalHonor, sqlUserOptionalVolume } from '@/lib/optionals';
import { lockedWeeksByUserFromTable } from '@/lib/lockedWeeks';
import { displayBelt } from '@/lib/belts';
import { householdBonusHonor } from '@/lib/scoreboard';
import { claimAndSend, sendNow } from '@/lib/emails/send';
import { buildScoreboardEmail, type ScoreboardRow } from '@/lib/emails/templates';
import { todayInNewYork } from '@/lib/emails/nudge';
import { sqlSetCounts } from '@/lib/skippedSets';
import { sqlSessionStamp } from '@/lib/performancePeriod';

type RosterUser = { id: number; name: string; email: string | null };

function extraScoreboardTo() {
  return (process.env.WORKIT_SCOREBOARD_TO || '').trim() || null;
}

type SessionPointer = { user_id: number; workout_type: string; week_number: number; day_number: number };

/** First row per athlete from rows already in the wanted order. */
function firstByUser<T extends { user_id: number }>(rows: T[]): Map<number, T> {
  const map = new Map<number, T>();
  for (const row of rows) {
    if (!map.has(Number(row.user_id))) map.set(Number(row.user_id), row);
  }
  return map;
}

async function loadScoreboardBoard() {
  // Grouped reads for the whole roster, all at once, instead of three queries per athlete.
  const [users, compare, lockedByUser, weekStats, lastDone, openNow, bonusHonor, optionalHonor] = await Promise.all([
    query('SELECT id, name, email, gender FROM users ORDER BY id ASC'),
    householdExerciseCompare({ kind: 'scoreboard', period: '7' }),
    lockedWeeksByUserFromTable(),
    query(
      `SELECT
         ws.user_id,
         COUNT(DISTINCT CASE WHEN ws.is_completed THEN ws.id END) as workouts,
         COALESCE(SUM(${sqlSetVolume('es')}), 0)
           + ${sqlUserOptionalVolume(
             'ws.user_id',
             `AND optws.is_completed = 1 AND ${sqlSessionStamp('optws')} >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)`
           )} as volume
       FROM workout_sessions ws
       LEFT JOIN exercise_sets es ON es.workout_session_id = ws.id AND ${sqlSetCounts('es')}
       WHERE ${sqlSessionStamp('ws')} >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)
       GROUP BY ws.user_id`
    ),
    query(
      `SELECT user_id, workout_type, week_number, day_number
       FROM workout_sessions
       WHERE is_completed = 1
       ORDER BY completed_at DESC`
    ),
    query(
      `SELECT user_id, workout_type, week_number, day_number
       FROM workout_sessions
       WHERE is_completed = 0 OR is_completed IS NULL
       ORDER BY started_at DESC`
    ),
    householdBonusHonor('7'),
    householdOptionalHonor('7'),
  ]);
  const roster = users.rows as (RosterUser & { gender?: string | null })[];
  const standingByName = new Map(
    compare.rows.map((row) => [row.name.trim().toLowerCase(), standingSummary(row, compare.ranking)])
  );
  const compareById = new Map(compare.rows.map((row) => [row.userId, row]));
  const statsByUser = firstByUser(weekStats.rows as { user_id: number; workouts: number; volume: number }[]);
  const lastByUser = firstByUser(lastDone.rows as SessionPointer[]);
  const openByUser = firstByUser(openNow.rows as SessionPointer[]);

  const rows: ScoreboardRow[] = roster.map((user) => {
    const stats = statsByUser.get(Number(user.id));
    const lastRow = lastByUser.get(Number(user.id));
    const openRow = openByUser.get(Number(user.id));
    return {
      name: user.name,
      email: user.email,
      workoutsThisWeek: Number(stats?.workouts || 0),
      volumeThisWeek: Number(stats?.volume || 0),
      lastWorkout: lastRow ? 'Week ' + lastRow.week_number + ' · ' + lastRow.workout_type : null,
      openSession: openRow ? openRow.workout_type : null,
      standing: isTestUserName(user.name)
        ? undefined
        : standingByName.get(user.name.trim().toLowerCase()),
      beltName: displayBelt(lockedByUser.get(Number(user.id)) || 0, user.gender).name,
    };
  });

  return { roster, rows, compareById, ranking: compare.ranking, bonusHonor, optionalHonor };
}

export async function buildLiveScoreboard(opts?: { userId?: number | null }) {
  const { rows, compareById, ranking, bonusHonor, optionalHonor } = await loadScoreboardBoard();
  const yours = opts?.userId != null ? compareById.get(opts.userId) ?? null : null;
  return buildScoreboardEmail({
    rangeLabel: 'last 7 days',
    rows,
    ranking: rankingSummary(ranking),
    yoursName: yours?.name,
    yours: yours ? standingSummary(yours, ranking) : undefined,
    bonusHonor,
    optionalHonor,
  });
}

function scoreboardRecipients(users: RosterUser[]) {
  const seen = new Set<string>();
  const recipients: { userId: number | null; name: string | null; email: string }[] = [];

  for (const user of users) {
    const email = (user.email || '').trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    recipients.push({ userId: user.id, name: user.name, email });
  }

  const extra = extraScoreboardTo()?.toLowerCase();
  if (extra && !seen.has(extra)) {
    recipients.push({ userId: null, name: null, email: extra });
  }

  return recipients;
}

export async function sendScoreboardEmail(opts?: { force?: boolean }) {
  // Recipients only: blocked athletes still appear on the board itself (loadScoreboardBoard).
  const users = await query(
    `SELECT u.id, u.name, u.email FROM users u WHERE ${SQL_NOT_BLOCKED_USER} AND ${SQL_NOT_JOIN_DRAFT} ORDER BY u.id ASC`
  );
  const recipients = scoreboardRecipients(users.rows as RosterUser[]);
  if (recipients.length === 0) return { sent: false, skipped: 'no-recipients', results: [] };

  const board = await loadScoreboardBoard();
  const { date } = todayInNewYork();
  const results = [];

  for (const recipient of recipients) {
    const yours =
      recipient.userId != null ? board.compareById.get(recipient.userId) ?? null : null;
    const email = buildScoreboardEmail({
      rangeLabel: 'last 7 days',
      rows: board.rows,
      ranking: rankingSummary(board.ranking),
      yoursName: yours?.name,
      yours: yours ? standingSummary(yours, board.ranking) : undefined,
      bonusHonor: board.bonusHonor,
      optionalHonor: board.optionalHonor,
    });
    if (opts?.force) {
      const id = await sendNow(recipient.email, email, {
        userId: recipient.userId,
        athleteName: recipient.name,
        template: 'scoreboard',
      });
      results.push({
        to: recipient.email,
        sent: Boolean(id),
        id,
        skipped: id ? undefined : 'smtp',
      });
      continue;
    }

    results.push(
      await claimAndSend({
        userId: recipient.userId,
        athleteName: recipient.name,
        template: 'scoreboard',
        dedupeKey: date + ':user:' + (recipient.userId ?? recipient.email),
        to: recipient.email,
        email,
      })
    );
  }

  return {
    sent: results.some((row) => row.sent),
    results,
    skipped: results.every((row) => !row.sent) ? results[0]?.skipped : undefined,
  };
}
