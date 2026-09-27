// Applies one or more database/*.sql migrations statement by statement, in order.
// Run: npx tsx --env-file=.env.local scripts/apply-migration.ts migrate-a.sql migrate-b.sql
// Same skip rule as scripts/apply-your-pick-migration.ts: a duplicate column/table is
// reported as already applied, anything else fails the run.
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
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('Usage: scripts/apply-migration.ts <file.sql> [...]');
    process.exitCode = 1;
    return;
  }
  for (const file of files) {
    const sql = readFileSync(join(__dirname, '..', 'database', file), 'utf8');
    for (const statement of statements(sql)) {
      const label = `${file}: ${statement.split('\n')[0].slice(0, 70)}`;
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
}

main();
