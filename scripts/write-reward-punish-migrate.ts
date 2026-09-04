import { writeFileSync } from 'fs';
import { FALLBACK_LINE_PACKS } from '../lib/coachLines';

function sql(value: string) {
  return "'" + value.replace(/'/g, "''") + "'";
}

const voices = ['master', 'james', 'luna'] as const;
const listBuckets = [
  ['initial', 'initial'],
  ['mid', 'mid'],
  ['final', 'final'],
  ['exit', 'exit'],
  ['bonusComplete', 'bonus_complete'],
  ['resume', 'resume'],
  ['missedWeek', 'missed_week'],
] as const;

const rows: string[] = [];
for (const voiceId of voices) {
  const pack = FALLBACK_LINE_PACKS[voiceId];
  for (const [key, bucket] of listBuckets) {
    pack[key].forEach((body, sort) => {
      rows.push(`(${sql(voiceId)}, ${sql(bucket)}, ${sort}, NULL, ${sql(body)}, 1)`);
    });
  }
  rows.push(`(${sql(voiceId)}, 'set_down', 0, ${sql(pack.setDownTitle)}, ${sql(pack.setDownBody)}, 1)`);
  for (const score of [1, 2] as const) {
    const item = pack.hardness[score];
    rows.push(
      `(${sql(voiceId)}, ${sql('hardness_' + score)}, 0, ${sql(item.title)}, ${sql(item.body)}, 1)`
    );
  }
}

const sqlText = `-- Reward / punishment rewrite: start, mid, last third, bonus, exit, resume, missed week, drop, hardness 1-2.
-- {name} is filled in the app as first name. Apply on PlanetScale by hand. Safe to re-run.

DELETE FROM coach_lines
WHERE bucket IN (
  'initial', 'mid', 'final', 'exit', 'bonus_complete', 'resume', 'missed_week', 'set_down', 'hardness_1', 'hardness_2'
);

INSERT INTO coach_lines (voice_id, bucket, sort_order, title, body, is_active) VALUES
${rows.join(',\n')};
`;

writeFileSync(new URL('../database/migrate-coach-reward-punish.sql', import.meta.url), sqlText);
console.log('wrote database/migrate-coach-reward-punish.sql', rows.length, 'rows');
