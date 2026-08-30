import { writeFileSync } from 'fs';
import { FALLBACK_VOICES } from '../lib/coachCatalog';
import { FALLBACK_LINE_PACKS } from '../lib/coachLines';

function sql(value: string) {
  return "'" + value.replace(/'/g, "''") + "'";
}

function lineRows(voiceId: string) {
  const pack = FALLBACK_LINE_PACKS[voiceId as keyof typeof FALLBACK_LINE_PACKS];
  const rows: string[] = [];
  const buckets = ['initial', 'mid', 'final', 'exit', 'complete'] as const;
  for (const bucket of buckets) {
    pack[bucket].forEach((body, sort) => {
      rows.push(`(${sql(voiceId)}, ${sql(bucket)}, ${sort}, NULL, ${sql(body)}, 1)`);
    });
  }
  pack.bonusComplete.forEach((body, sort) => {
    rows.push(`(${sql(voiceId)}, 'bonus_complete', ${sort + 1}, NULL, ${sql(body)}, 1)`);
  });
  pack.optionalComplete.forEach((body, sort) => {
    rows.push(`(${sql(voiceId)}, 'optional_complete', ${sort + 1}, NULL, ${sql(body)}, 1)`);
  });
  (['weekPlace1', 'weekPlace2', 'weekPlace3'] as const).forEach((key, index) => {
    pack[key].forEach((body, sort) => {
      rows.push(
        `(${sql(voiceId)}, ${sql('week_place_' + (index + 1))}, ${sort + 1}, NULL, ${sql(body)}, 1)`
      );
    });
  });
  rows.push(
    `(${sql(voiceId)}, 'set_up', 0, ${sql(pack.setUpTitle)}, ${sql(pack.setUpBody)}, 1)`
  );
  rows.push(
    `(${sql(voiceId)}, 'set_down', 0, ${sql(pack.setDownTitle)}, ${sql(pack.setDownBody)}, 1)`
  );
  ([1, 2, 3, 4, 5] as const).forEach((score) => {
    const item = pack.hardness[score];
    rows.push(
      `(${sql(voiceId)}, ${sql('hardness_' + score)}, 0, ${sql(item.title)}, ${sql(item.body)}, 1)`
    );
  });
  return rows;
}

const voices = FALLBACK_VOICES.filter((voice) => voice.id === 'master' || voice.id === 'james')
  .map(
    (voice) =>
      `(${sql(voice.id)}, ${sql(voice.displayName)}, ${sql(voice.description)}, ${sql(voice.blurb)}, ${sql(voice.fromName)}, 1)`
  )
  .join(',\n');

const lines = [...lineRows('master'), ...lineRows('james')].join(',\n');

const sqlText = `-- James Grey voice + Tom rewrite. Safe to re-run.
-- INSERT voices IGNORE. Lines upsert on (voice_id, bucket, sort_order).

INSERT IGNORE INTO coach_voices (id, display_name, description, blurb, from_name, is_active) VALUES
${voices};

UPDATE coach_voices v
JOIN (
  SELECT 'master' AS id, ${sql(FALLBACK_VOICES.find((voice) => voice.id === 'master')!.description)} AS description, ${sql(FALLBACK_VOICES.find((voice) => voice.id === 'master')!.blurb)} AS blurb
) src ON src.id = v.id
SET v.description = src.description, v.blurb = src.blurb;

INSERT INTO coach_lines (voice_id, bucket, sort_order, title, body, is_active) VALUES
${lines}
ON DUPLICATE KEY UPDATE title = VALUES(title), body = VALUES(body), is_active = 1;
`;

writeFileSync(new URL('../database/migrate-james-voice.sql', import.meta.url), sqlText);
console.log('wrote database/migrate-james-voice.sql');

const luna = FALLBACK_VOICES.find((voice) => voice.id === 'luna')!;
const lunaSql = `-- Luna Meadows rewrite (Nicole McPherson register). Safe to re-run.
-- Apply migrate-luna-id.sql first if the voice row is still sergeant.

UPDATE coach_voices
SET description = ${sql(luna.description)},
    blurb = ${sql(luna.blurb)}
WHERE id = 'luna';

INSERT INTO coach_lines (voice_id, bucket, sort_order, title, body, is_active) VALUES
${lineRows('luna').join(',\n')}
ON DUPLICATE KEY UPDATE title = VALUES(title), body = VALUES(body), is_active = 1;
`;
writeFileSync(new URL('../database/migrate-luna-voice.sql', import.meta.url), lunaSql);
console.log('wrote database/migrate-luna-voice.sql');
