-- Extra Tom lines (Pillion register). App falls back to code banks if missing.
-- Run on PlanetScale by hand. INSERT IGNORE is safe. Hardness 5 UPDATE is idempotent.

INSERT IGNORE INTO coach_lines (voice_id, bucket, sort_order, title, body, is_active) VALUES
('master', 'initial', 16, NULL, 'You don''t ask where we''re going. You just sit under the bar and keep your hands on the weights.', 1),
('master', 'initial', 18, NULL, 'Stand straight. If you''re going to carry yourself like that, don''t do it around me.', 1),
('master', 'initial', 19, NULL, 'I am structured', 1),
('master', 'mid', 16, NULL, 'I don''t need you to think about it. I need you to do it.', 1),
('master', 'mid', 17, NULL, 'You like being told what to do, don''t you?', 1),
('master', 'mid', 18, NULL, 'What am I going to do with you?', 1),
('master', 'complete', 24, NULL, 'You can get started on dinner. You''re useful now.', 1),
('master', 'complete', 25, NULL, 'Eat up. You look like a gust of wind could knock you off the back.', 1),
('master', 'complete', 26, NULL, 'That''s enough out of you for today.', 1);

UPDATE coach_lines
SET title = 'DO YOU GIVE?', body = 'You must give.'
WHERE voice_id = 'master' AND bucket = 'hardness_5' AND sort_order = 0;
