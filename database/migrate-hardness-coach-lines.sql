-- Set hardness (1 Easy – 5 Max) coach lines. App falls back to code banks if missing.
-- Run on PlanetScale by hand. Re-run = duplicate ignore.
INSERT IGNORE INTO coach_lines (voice_id, bucket, sort_order, title, body, is_active) VALUES
('master', 'hardness_1', 0, 'TOO EASY', 'That was a warm handshake, man. Next set we add.', 1),
('master', 'hardness_2', 0, 'LIGHT WORK', 'You had more in the tank. I felt it.', 1),
('master', 'hardness_3', 0, 'HONEST SET', 'That is a working set. Stay there or go up.', 1),
('master', 'hardness_4', 0, 'THAT COST YOU', 'Good man. Hard is the point.', 1),
('master', 'hardness_5', 0, 'MAX EFFORT', 'You emptied it. I saw that.', 1),
('sergeant', 'hardness_1', 0, 'Too easy', 'Your body had more. We can ask for it next time.', 1),
('sergeant', 'hardness_2', 0, 'Light', 'Gentle is fine. Leave a little room to grow.', 1),
('sergeant', 'hardness_3', 0, 'Honest work', 'That met you where you are. Stay present.', 1),
('sergeant', 'hardness_4', 0, 'Hard', 'You stayed with the difficulty. Beautiful.', 1),
('sergeant', 'hardness_5', 0, 'Max', 'You gave the whole set. Rest and receive it.', 1);
