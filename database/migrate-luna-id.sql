-- Rename Luna voice_id / coach_tone from sergeant → luna. Safe to re-run.
-- Apply this before migrate-luna-voice.sql. Drops sergeant lines that already
-- have a luna twin so the unique (voice_id, bucket, sort_order) key cannot collide.

UPDATE users SET coach_tone = 'luna' WHERE coach_tone = 'sergeant';

INSERT IGNORE INTO coach_voices (id, display_name, description, blurb, from_name, is_active)
SELECT 'luna', display_name, description, blurb, from_name, is_active
FROM coach_voices
WHERE id = 'sergeant';

DELETE s
FROM coach_lines s
INNER JOIN coach_lines l
  ON l.voice_id = 'luna'
 AND l.bucket = s.bucket
 AND l.sort_order = s.sort_order
WHERE s.voice_id = 'sergeant';

UPDATE coach_lines SET voice_id = 'luna' WHERE voice_id = 'sergeant';

DELETE FROM coach_voices WHERE id = 'sergeant';
