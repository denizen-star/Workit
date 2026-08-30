-- Tom roast when last Eastern week had fewer than 4 finished sessions.
-- Run on PlanetScale by hand. Re-run = duplicate ignore.

INSERT IGNORE INTO coach_lines (voice_id, bucket, sort_order, title, body, is_active) VALUES
('master', 'missed_week', 0, NULL, 'Oh, sorry... were you busy?\nIs there a booming market for {name}?', 1);
