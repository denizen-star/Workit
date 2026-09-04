import { FALLBACK_VOICES } from '../lib/coachCatalog';
import { FALLBACK_LINE_PACKS } from '../lib/coachLines';
import { query } from '../lib/db';

const BUCKETS = [
  'initial',
  'mid',
  'final',
  'exit',
  'complete',
  'bonus_complete',
  'optional_complete',
  'resume',
  'missed_week',
  'week_place_1',
  'week_place_2',
  'week_place_3',
  'set_up',
  'set_down',
  'hardness_1',
  'hardness_2',
  'hardness_3',
  'hardness_4',
  'hardness_5',
] as const;

type LineRow = [string, string, number, string | null, string];

function collectRows(): LineRow[] {
  const rows: LineRow[] = [];
  for (const voiceId of ['master', 'james', 'luna'] as const) {
    const pack = FALLBACK_LINE_PACKS[voiceId];
    const lists: Array<[readonly string[], string]> = [
      [pack.initial, 'initial'],
      [pack.mid, 'mid'],
      [pack.final, 'final'],
      [pack.exit, 'exit'],
      [pack.complete, 'complete'],
      [pack.bonusComplete, 'bonus_complete'],
      [pack.optionalComplete, 'optional_complete'],
      [pack.resume, 'resume'],
      [pack.missedWeek, 'missed_week'],
      [pack.weekPlace1, 'week_place_1'],
      [pack.weekPlace2, 'week_place_2'],
      [pack.weekPlace3, 'week_place_3'],
    ];
    for (const [bodies, bucket] of lists) {
      bodies.forEach((body, sort) => {
        rows.push([voiceId, bucket, sort, null, body]);
      });
    }
    rows.push([voiceId, 'set_up', 0, pack.setUpTitle, pack.setUpBody]);
    rows.push([voiceId, 'set_down', 0, pack.setDownTitle, pack.setDownBody]);
    ([1, 2, 3, 4, 5] as const).forEach((score) => {
      const item = pack.hardness[score];
      rows.push([voiceId, 'hardness_' + score, 0, item.title, item.body]);
    });
  }
  return rows;
}

async function main() {
  const rows = collectRows();
  console.log('replacing', rows.length, 'coach_lines');

  await query(
    `DELETE FROM coach_lines WHERE voice_id IN ('master', 'james', 'luna') AND bucket IN (${BUCKETS.map(() => '?').join(',')})`,
    [...BUCKETS]
  );

  const chunkSize = 40;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, 1)').join(', ');
    const params = chunk.flatMap(([voiceId, bucket, sort, title, body]) => [
      voiceId,
      bucket,
      sort,
      title,
      body,
    ]);
    await query(
      `INSERT INTO coach_lines (voice_id, bucket, sort_order, title, body, is_active) VALUES ${placeholders}`,
      params
    );
  }

  for (const voice of FALLBACK_VOICES) {
    await query(
      'UPDATE coach_voices SET display_name = ?, description = ?, blurb = ?, from_name = ?, is_active = 1 WHERE id = ?',
      [voice.displayName, voice.description, voice.blurb, voice.fromName, voice.id]
    );
  }

  const check = await query(
    `SELECT voice_id, bucket, COUNT(*) as n FROM coach_lines WHERE voice_id IN ('master','james','luna') GROUP BY voice_id, bucket ORDER BY voice_id, bucket`
  );
  console.log(check.rows);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
