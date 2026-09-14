// One-off: applies database/migrate-hyrox.sql statement by statement.
// Run: npx tsx --env-file=.env.local scripts/apply-hyrox-migration.ts
import { query } from '../lib/db';

const STATEMENTS: { label: string; sql: string }[] = [
  {
    label: 'hyrox_state',
    sql: `CREATE TABLE IF NOT EXISTS hyrox_state (
      user_id INT NOT NULL PRIMARY KEY,
      active TINYINT(1) NOT NULL DEFAULT 0,
      hyrox_week INT NOT NULL DEFAULT 1,
      normal_week_at_start INT NOT NULL,
      normal_day_at_start INT NOT NULL,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
  },
  {
    label: 'hyrox_milestones',
    sql: `CREATE TABLE IF NOT EXISTS hyrox_milestones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      milestone_number TINYINT NOT NULL,
      result VARCHAR(8) NOT NULL,
      decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_milestone (user_id, milestone_number)
    )`,
  },
  {
    label: 'hyrox_diplomas',
    sql: `CREATE TABLE IF NOT EXISTS hyrox_diplomas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      tier TINYINT NOT NULL,
      earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_tier (user_id, tier)
    )`,
  },
  {
    label: 'workout_sessions.program_track',
    sql: `ALTER TABLE workout_sessions ADD COLUMN program_track VARCHAR(16) NOT NULL DEFAULT 'main'`,
  },
];

async function main() {
  for (const { label, sql } of STATEMENTS) {
    try {
      await query(sql);
      console.log(`OK: ${label}`);
    } catch (error: any) {
      const message = String(error?.message || error);
      if (/duplicate column|already exists/i.test(message)) {
        console.log(`SKIP (already applied): ${label}`);
      } else {
        console.error(`FAILED: ${label} —`, message);
        process.exitCode = 1;
      }
    }
  }
}

main();
