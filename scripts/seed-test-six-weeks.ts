// One-off QA seed: marks the Test user's weeks 1-6 of the normal program as
// finished (4 required sessions each), dated so today reads as Monday of week 7 —
// enough to clear the Hyrox Training 6-locked-week eligibility gate for manual testing.
// Run: npx tsx --env-file=.env.local scripts/seed-test-six-weeks.ts
import { query } from '../lib/db';
import { workoutProgram } from '../lib/workoutData';
import { requiredDays } from '../lib/bonusDay';

function mondayOf(date: Date): Date {
  const day = date.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  const result = new Date(date);
  result.setDate(result.getDate() + diff);
  result.setHours(9, 0, 0, 0);
  return result;
}

function dateForSuggestedDay(weekMonday: Date, suggestedDay: string): Date {
  const offsets: Record<string, number> = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };
  const offset = offsets[suggestedDay] ?? 0;
  const result = new Date(weekMonday);
  result.setDate(result.getDate() + offset);
  return result;
}

function toSql(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function main() {
  const userResult = await query("SELECT id, name FROM users WHERE LOWER(TRIM(name)) = 'test' LIMIT 1");
  const testUser = userResult.rows[0] as { id: number; name: string } | undefined;
  if (!testUser) {
    console.error('No user named "Test" found — nothing to seed.');
    process.exitCode = 1;
    return;
  }

  const thisMonday = mondayOf(new Date()); // Week 7's Monday
  console.log(`Test user id=${testUser.id}. Anchoring week 7 to ${thisMonday.toDateString()}.`);

  for (let weekNumber = 1; weekNumber <= 6; weekNumber++) {
    const week = workoutProgram.find((item) => item.weekNumber === weekNumber);
    if (!week) continue;

    // Week N's Monday is (7 - N) weeks before week 7's Monday.
    const weekMonday = new Date(thisMonday);
    weekMonday.setDate(weekMonday.getDate() - (7 - weekNumber) * 7);

    const existing = await query(
      'SELECT day_number FROM workout_sessions WHERE user_id = ? AND week_number = ? AND is_completed = 1',
      [testUser.id, weekNumber]
    );
    const already = new Set((existing.rows as { day_number: number }[]).map((row) => Number(row.day_number)));

    for (const day of requiredDays(week)) {
      if (already.has(day.dayNumber)) {
        console.log(`Week ${weekNumber} Day ${day.dayNumber} already complete — skipping.`);
        continue;
      }
      const when = toSql(dateForSuggestedDay(weekMonday, day.suggestedDay));
      await query(
        `INSERT INTO workout_sessions
           (user_id, week_number, day_number, workout_type, workout_mode, program_track, scheduled_date, started_at, is_completed, completed_at, ended_at)
         VALUES (?, ?, ?, ?, 'gym', 'main', ?, ?, 1, ?, ?)`,
        [testUser.id, weekNumber, day.dayNumber, day.name, when.slice(0, 10), when, when, when]
      );
      console.log(`Inserted Week ${weekNumber} Day ${day.dayNumber} (${day.name}) @ ${when}`);
    }
  }

  console.log('Done. Test should now show 6 locked weeks, next up: Week 7 Day 1.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
