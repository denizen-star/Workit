import { readFileSync } from 'fs';
import { coachClipTemplate } from '../lib/coachClip';
import { COACH_ELEVEN_VOICE_IDS, coachClipKey, speakableCoachText, type VoicedCoach } from '../lib/coachAudio';
import { FALLBACK_LINE_PACKS, PR_CLIPS } from '../lib/coachLines';
import { query } from '../lib/db';

type Clip = {
  bucket: string;
  sortOrder: number;
  template: string;
  spoken: string;
};

const dry = process.argv.includes('--dry');

function add(map: Map<string, Clip>, bucket: string, sortOrder: number, template: string) {
  const spoken = speakableCoachText(template);
  if (!template.trim() || !spoken || map.has(template)) return;
  map.set(template, { bucket, sortOrder, template, spoken });
}

async function collect(voice: VoicedCoach): Promise<Clip[]> {
  const map = new Map<string, Clip>();
  const pack = FALLBACK_LINE_PACKS[voice];
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
    [pack.sessionStart ?? [], 'session_start'],
    [pack.hyroxMilestonePass ?? [], 'hyrox_pass'],
    [pack.hyroxMilestoneFail ?? [], 'hyrox_fail'],
  ];
  for (const [bodies, bucket] of lists) {
    bodies.forEach((body, sort) => add(map, bucket, sort, body));
  }
  add(map, 'set_up', 0, coachClipTemplate(pack.setUpTitle, pack.setUpBody));
  add(map, 'set_down', 0, coachClipTemplate(pack.setDownTitle, pack.setDownBody));
  ([1, 2, 3, 4, 5] as const).forEach((score) => {
    const item = pack.hardness[score];
    add(map, 'hardness_' + score, 0, coachClipTemplate(item.title, item.body));
  });
  const pr = PR_CLIPS[voice];
  if (pr) add(map, 'pr', 0, pr);

  const storedIds = voice === 'luna' ? ['luna', 'sergeant'] : [voice];
  const live = await query(
    `SELECT bucket, sort_order, title, body FROM coach_lines WHERE voice_id IN (${storedIds.map(() => '?').join(',')}) AND is_active = 1 ORDER BY bucket, sort_order`,
    storedIds
  );
  for (const row of live.rows as Array<{ bucket: string; sort_order: number; title: string | null; body: string }>) {
    add(map, row.bucket, row.sort_order, coachClipTemplate(row.title, row.body));
  }
  return [...map.values()];
}

async function ensureTable() {
  const sql = readFileSync(new URL('../database/migrate-coach-voice-clips.sql', import.meta.url), 'utf8');
  await query(sql);
}

async function synthesize(text: string, apiKey: string, elevenVoiceId: string): Promise<Uint8Array> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${elevenVoiceId}?output_format=mp3_22050_32`;
  let lastStatus = 0;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
      }),
    });
    lastStatus = response.status;
    if (response.status === 429 || response.status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
      continue;
    }
    if (!response.ok) {
      const detail = await response.text();
      const error = new Error(`ElevenLabs ${response.status}: ${detail.slice(0, 240)}`);
      if (detail.includes('quota_exceeded')) error.name = 'QuotaExceeded';
      throw error;
    }
    return new Uint8Array(await response.arrayBuffer());
  }
  throw new Error(`ElevenLabs ${lastStatus} after retries`);
}

async function main() {
  const requested = process.argv.find((arg) => arg === 'master' || arg === 'james' || arg === 'luna' || arg === 'eli') || 'master';
  const voice = requested as VoicedCoach;
  const elevenVoiceId = COACH_ELEVEN_VOICE_IDS[voice];
  const clips = await collect(voice);
  console.log(voice, 'clips', clips.length);
  if (dry) {
    for (const clip of clips) console.log(clip.bucket, clip.sortOrder, clip.spoken);
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is missing');

  await ensureTable();
  await query(`DELETE FROM coach_voice_clips WHERE voice_id = ? AND eleven_voice_id <> ?`, [voice, elevenVoiceId]);
  const existing = await query(
    `SELECT clip_key FROM coach_voice_clips WHERE voice_id = ? AND eleven_voice_id = ?`,
    [voice, elevenVoiceId]
  );
  const have = new Set((existing.rows as Array<{ clip_key: string }>).map((row) => row.clip_key));

  let stored = 0;
  let skipped = 0;
  const failed: string[] = [];
  for (const clip of clips) {
    const key = coachClipKey(clip.template);
    if (have.has(key)) {
      skipped += 1;
      continue;
    }
    try {
      const audio = await synthesize(clip.spoken, apiKey, elevenVoiceId);
      if (audio.byteLength < 128) throw new Error('audio too small');
      await query(
        `INSERT INTO coach_voice_clips
          (voice_id, eleven_voice_id, bucket, sort_order, clip_key, template, spoken_text, audio, bytes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [voice, elevenVoiceId, clip.bucket, clip.sortOrder, key, clip.template, clip.spoken, audio, audio.byteLength]
      );
      stored += 1;
      console.log(`${stored + skipped}/${clips.length}`, clip.bucket, audio.byteLength);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'failed';
      failed.push(`${clip.bucket}:${clip.sortOrder} ${message}`);
      console.error('fail', clip.bucket, clip.sortOrder, message);
      if (error instanceof Error && error.name === 'QuotaExceeded') break;
    }
  }
  console.log('stored', stored, 'skipped', skipped, 'failed', failed.length);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
