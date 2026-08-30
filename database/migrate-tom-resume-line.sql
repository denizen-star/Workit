-- Tom resume shout for open sessions (in-app + resume mail).
-- Run on PlanetScale by hand. Safe to re-run.

INSERT IGNORE INTO coach_lines (voice_id, bucket, sort_order, title, body, is_active) VALUES
('master', 'resume', 0, NULL, 'You''re late. If you''re late again, you stay out of the house.', 1);

DELETE FROM coach_lines
WHERE voice_id = 'master'
  AND bucket = 'initial'
  AND sort_order = 17
  AND body = 'You''re late. If you''re late again, you stay out of the house.';
