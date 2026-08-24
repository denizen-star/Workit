-- Optional. App falls back to code banks if these rows are missing.
-- Run on PlanetScale by hand. Re-run = duplicate ignore.
INSERT IGNORE INTO coach_lines (voice_id, bucket, sort_order, title, body, is_active) VALUES
('master', 'optional_complete', 1, NULL, 'OPTIONAL LOCKED. You did not owe me those ten minutes, man. You paid them. The board felt it.', 1),
('master', 'optional_complete', 2, NULL, 'EASY WORK, REAL LBS. Run, bike, stretch, core — I do not care. You stayed for the clock. Good man.', 1),
('master', 'optional_complete', 3, NULL, 'FIVE HUNDRED ON THE HOUSE. Cheap for ten minutes. Expensive if you skip. You did not skip.', 1),
('master', 'optional_complete', 4, NULL, 'THE LEAD CAN HEAR THAT. Extra minutes. Extra iron on the board. Hunt.', 1),
('master', 'optional_complete', 5, NULL, 'WARMUP AND COOLDOWN ARE NOT DECORATION. You treated them like tax. That is how a man closes a gap.', 1),
('sergeant', 'optional_complete', 1, NULL, 'Optional practice complete. Ten easy minutes, fully given. Thank you for that extra care.', 1),
('sergeant', 'optional_complete', 2, NULL, 'You chose the extra clock and stayed kind with it. Those pounds are yours.', 1),
('sergeant', 'optional_complete', 3, NULL, 'Warmup or cooldown, you honored the time. Rest well. The work counts.', 1),
('sergeant', 'optional_complete', 4, NULL, 'Easy does not mean empty. You stayed for the whole ten. Beautiful.', 1),
('sergeant', 'optional_complete', 5, NULL, 'You did not have to add those minutes. You added them. Carry that quietly.', 1);
