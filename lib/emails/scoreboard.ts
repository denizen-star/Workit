import { query } from '@/lib/db';
import { householdExerciseCompare, rankingSummary, standingSummary } from '@/lib/exerciseCompare';
import { sqlSetVolume } from '@/lib/exerciseKind';
import { isTestUserName } from '@/lib/householdUsers';
import { householdOptionalHonor, sqlUserOptionalVolume } from '@/lib/optionals';
import { householdBonusHonor } from '@/lib/scoreboard';
import { claimAndSend, sendNow } from '@/lib/emails/send';
import { buildScoreboardEmail, type ScoreboardRow } from '@/lib/emails/templates';
import { todayInNewYork } from '@/lib/emails/nudge';

type RosterUser = { id: number; name: string; email: string | null };

function extraScoreboardTo() {
  return (process.env.WORKIT_SCOREBOARD_TO || '').trim() || null;
}

async function loadScoreboardBoard() {
  const users = await query('SELECT id, name, email FROM users ORDER BY id ASC');
  const roster = users.rows as RosterUser[];
  const compare = await householdExerciseCompare({ kind: 'scoreboard', period: '7' });
  const standingByName = new Map(
    compare.rows.map((row) => [row.name.trim().toLowerCase(), standingSummary(row, compare.ranking)])
  );
  const compareById = new Map(compare.rows.map((row) => [row.userId, row]));
  const rows: ScoreboardRow[] = [];

  for (const user of roster) {
    const weekStats = await query(
      `SELECT
         COUNT(DISTINCT CASE WHEN ws.is_completed THEN ws.id END) as workouts,
         COALESCE(SUM(${sqlSetVolume('es')}), 0)
           + ${sqlUserOptionalVolume(
             'ws.user_id',
             `AND optws.is_completed = 1 AND COALESCE(optws.completed_at, optws.started_at, optws.created_at) >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)`
           )} as volume
       FROM workout_sessions ws
       LEFT JOIN exercise_sets es ON es.workout_session_id = ws.id
       WHERE ws.user_id = ?
         AND COALESCE(ws.completed_at, ws.started_at, ws.created_at) >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)`,
      [user.id]
    );
    const last = await query(
      `SELECT workout_type, week_number, day_number, completed_at
       FROM workout_sessions
       WHERE user_id = ? AND is_completed = 1
       ORDER BY completed_at DESC
       LIMIT 1`,
      [user.id]
    );
    const open = await query(
      `SELECT workout_type, week_number, day_number
       FROM workout_sessions
       WHERE user_id = ? AND (is_completed = 0 OR is_completed IS NULL)
       ORDER BY started_at DESC
       LIMIT 1`,
      [user.id]
    );

    const stats = weekStats.rows[0] as { workouts: number; volume: number };
    const lastRow = last.rows[0] as
      | { workout_type: string; week_number: number; day_number: number; completed_at: string }
      | undefined;
    const openRow = open.rows[0] as
      | { workout_type: string; week_number: number; day_number: number }
      | undefined;

    rows.push({
      name: user.name,
      email: user.email,
      workoutsThisWeek: Number(stats?.workouts || 0),
      volumeThisWeek: Number(stats?.volume || 0),
      lastWorkout: lastRow
        ? 'Week ' + lastRow.week_number + ' · ' + lastRow.workout_type
        : null,
      openSession: openRow ? openRow.workout_type : null,
      standing: isTestUserName(user.name)
        ? undefined
        : standingByName.get(user.name.trim().toLowerCase()),
    });
  }

  const bonusHonor = await householdBonusHonor('7');
  const optionalHonor = await householdOptionalHonor('7');
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
  const recipients: { userId: number | null; email: string }[] = [];

  for (const user of users) {
    const email = (user.email || '').trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    recipients.push({ userId: user.id, email });
  }

  const extra = extraScoreboardTo()?.toLowerCase();
  if (extra && !seen.has(extra)) {
    recipients.push({ userId: null, email: extra });
  }

  return recipients;
}

export async function sendScoreboardEmail(opts?: { force?: boolean }) {
  const users = await query('SELECT id, name, email FROM users ORDER BY id ASC');
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
      const id = await sendNow(recipient.email, email);
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
