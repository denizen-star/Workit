// Re-prices run/bike credit by the time actually done (cardioCreditLbs, lib/optionals.ts)
// for slots / Run Your picks finished on one Eastern date (default today).
// Dry run by default; --apply writes and refreshes daily_stats for each touched session.
// Run: npx tsx --env-file=.env.local scripts/recalc-cardio-credit.ts [--date=YYYY-MM-DD] [--apply]
import { easternYmd } from '../lib/analyticsTime';
import { updateDailyStats } from '../lib/dailyStats';
import { query } from '../lib/db';
import { cardioCreditLbs, optionalSlotLbs, parseDbTime } from '../lib/optionals';
import { runPickMinutes } from '../lib/yourPick';

type Row = {
  id: number;
  user_id: number;
  name: string;
  day_number: number;
  pick_type: string | null;
  started_at: string | null;
  completed_at: string | null;
  credit_lbs: number | null;
  warmup_track: string | null;
  warmup_level: string | null;
  warmup_started_at: string | null;
  warmup_completed_at: string | null;
  warmup_lbs: number | null;
  cooldown_track: string | null;
  cooldown_level: string | null;
  cooldown_started_at: string | null;
  cooldown_completed_at: string | null;
  cooldown_lbs: number | null;
};

function seconds(start: string | null, end: string | null) {
  const a = parseDbTime(start);
  const b = parseDbTime(end);
  return a == null || b == null ? 0 : Math.max(0, Math.floor((b - a) / 1000));
}

function onDate(value: string | null, date: string) {
  const t = parseDbTime(value);
  return t != null && easternYmd(new Date(t)) === date;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const date = process.argv.find((arg) => arg.startsWith('--date='))?.slice(7) || easternYmd(new Date());
  const result = await query(
    `SELECT ws.id, ws.user_id, u.name, ws.day_number, ws.pick_type, ws.started_at, ws.completed_at, ws.credit_lbs,
            ws.warmup_track, ws.warmup_level, ws.warmup_started_at, ws.warmup_completed_at, ws.warmup_lbs,
            ws.cooldown_track, ws.cooldown_level, ws.cooldown_started_at, ws.cooldown_completed_at, ws.cooldown_lbs
     FROM workout_sessions ws
     INNER JOIN users u ON u.id = ws.user_id
     WHERE (ws.warmup_track IN ('run', 'bike') AND ws.warmup_completed_at >= UTC_TIMESTAMP() - INTERVAL 3 DAY)
        OR (ws.cooldown_track IN ('run', 'bike') AND ws.cooldown_completed_at >= UTC_TIMESTAMP() - INTERVAL 3 DAY)
        OR (ws.pick_type = 'run' AND ws.is_completed = 1 AND ws.completed_at >= UTC_TIMESTAMP() - INTERVAL 3 DAY)`
  );

  let changes = 0;
  for (const row of result.rows as Row[]) {
    const updates: { column: string; from: number; to: number; what: string }[] = [];
    for (const slot of ['warmup', 'cooldown'] as const) {
      const track = row[`${slot}_track`];
      if ((track !== 'run' && track !== 'bike') || !onDate(row[`${slot}_completed_at`], date)) continue;
      const done = seconds(row[`${slot}_started_at`], row[`${slot}_completed_at`]);
      const to = optionalSlotLbs(track, row[`${slot}_level`], done);
      const from = Number(row[`${slot}_lbs`] || 0);
      updates.push({ column: `${slot}_lbs`, from, to, what: `${slot} ${track} ${Math.floor(done / 60)} min` });
    }
    if (row.pick_type === 'run' && onDate(row.completed_at, date)) {
      const done = seconds(row.started_at, row.completed_at);
      const to = cardioCreditLbs(done, (runPickMinutes(Number(row.day_number)) ?? 10) * 60);
      updates.push({ column: 'credit_lbs', from: Number(row.credit_lbs || 0), to, what: `Your pick run ${Math.floor(done / 60)} min` });
    }
    const changed = updates.filter((item) => item.from !== item.to);
    for (const item of updates) {
      console.log(
        `${row.name} · session ${row.id} · ${item.what}: ${item.from} → ${item.to} lb${item.from === item.to ? ' (no change)' : ''}`
      );
    }
    if (!changed.length) continue;
    changes += changed.length;
    if (!apply) continue;
    for (const item of changed) {
      await query(`UPDATE workout_sessions SET ${item.column} = ? WHERE id = ? AND user_id = ?`, [item.to, row.id, row.user_id]);
    }
    await updateDailyStats(Number(row.id), Number(row.user_id));
  }
  console.log(`${date}: ${changes} change(s)${apply ? ' applied' : ' (dry run — pass --apply to write)'}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
