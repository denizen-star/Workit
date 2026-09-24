// One-off: applies database/migrate-your-pick.sql statement by statement.
// Run: npx tsx --env-file=.env.local scripts/apply-your-pick-migration.ts
// Reads the .sql file itself so the SQL lives in one place. Re-run is safe:
// duplicate columns are skipped, badge rows are INSERT IGNORE.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { query } from '../lib/db';

function statements(sql: string): string[] {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
}

async function main() {
  const sql = readFileSync(join(__dirname, '..', 'database', 'migrate-your-pick.sql'), 'utf8');
  for (const statement of statements(sql)) {
    const label = statement.split('\n')[0].slice(0, 80);
    try {
      await query(statement);
      console.log(`OK: ${label}`);
    } catch (error) {
      const message = String(error instanceof Error ? error.message : error);
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
