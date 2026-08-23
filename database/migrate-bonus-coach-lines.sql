-- Optional. App falls back to code banks if these rows are missing.
-- Run on PlanetScale by hand. Re-run = duplicate ignore.
INSERT IGNORE INTO coach_lines (voice_id, bucket, sort_order, title, body, is_active) VALUES
('master', 'bonus_complete', 1, NULL, 'BONUS LOCKED. You did not owe me that, man. You paid anyway.', 1),
('master', 'bonus_complete', 2, NULL, 'EXTRA CREDIT. The four-day men can watch. You showed up when you did not have to.', 1),
('master', 'bonus_complete', 3, NULL, 'THAT WAS OPTIONAL. You treated optional like tax. Good man.', 1),
('master', 'bonus_complete', 4, NULL, 'BONUS BANKED. I saw the extra upper. So did the house.', 1),
('master', 'bonus_complete', 5, NULL, 'YOU WENT PAST THE WEEK. That is how a man gets marked on my board.', 1),
('sergeant', 'bonus_complete', 1, NULL, 'Bonus practice complete. You gave more than the week asked. Thank you for that extra care.', 1),
('sergeant', 'bonus_complete', 2, NULL, 'Optional work, full presence. You chose the extra upper and stayed kind with it.', 1),
('sergeant', 'bonus_complete', 3, NULL, 'That bonus day is yours. Rest well. You honored more than the required four.', 1),
('sergeant', 'bonus_complete', 4, NULL, 'Extra practice locked. I see the extra time you gave your body. Beautiful.', 1),
('sergeant', 'bonus_complete', 5, NULL, 'You did not have to stay. You stayed. Carry that quietly.', 1);
