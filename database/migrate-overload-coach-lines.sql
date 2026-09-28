-- Overload Progressions coach lines (buckets overload_start / overload_diploma), all 4 voices.
-- Generated from the lib/coachLines.ts fallback packs — edit there, then regenerate.
-- Apply: npx tsx --env-file=.env.local scripts/apply-migration.ts migrate-overload-coach-lines.sql
-- Re-run = safe (INSERT IGNORE on unique voice+bucket+sort_order).

INSERT IGNORE INTO coach_lines (voice_id, bucket, sort_order, title, body, is_active) VALUES
('master', 'overload_start', 0, NULL, 'Six weeks, {name}. Same lifts, heavier every time you earn it. I decide when you earned it. That is growth.', 1),
('master', 'overload_start', 1, NULL, 'You asked for more load. Take it clean, one plate at a time, and the power stays yours.', 1),
('master', 'overload_diploma', 0, NULL, 'Two weeks paid in full, {name}. The next ones cost more. Pay them. That is growth.', 1),
('master', 'overload_diploma', 1, NULL, 'That diploma is yours. Heavier bar next week. I did not say easier.', 1),
('james', 'overload_start', 0, NULL, 'Six weeks, {name}. I want the weight to move and the form to stay. Show me.', 1),
('james', 'overload_start', 1, NULL, 'Top of the range, then more load. Simple. I''ll be watching what it does to you.', 1),
('james', 'overload_diploma', 0, NULL, 'Another diploma, {name}. I like what the last two weeks did to you. Keep going.', 1),
('james', 'overload_diploma', 1, NULL, 'Two more weeks in the bar. It shows. Don''t stop now.', 1),
('luna', 'overload_start', 0, NULL, 'Six weeks, {name}. One more rep, then a little more weight. Breathe and keep climbing.', 1),
('luna', 'overload_start', 1, NULL, 'The load goes up slowly. So do you. Growth comes one step at a time.', 1),
('luna', 'overload_diploma', 0, NULL, 'Another two weeks held, {name}. Stay with it. The strength is settling in.', 1),
('luna', 'overload_diploma', 1, NULL, 'Soft breath, hard work, two more weeks. That is growth.', 1),
('eli', 'overload_start', 0, NULL, 'SIX WEEKS, {name}! Every week the bar gets heavier and so do you. Let''s go!', 1),
('eli', 'overload_start', 1, NULL, 'Hit the top of the range, earn the plate. I already know you will.', 1),
('eli', 'overload_diploma', 0, NULL, 'Another diploma, {name}! Look at you climbing! That is growth!', 1),
('eli', 'overload_diploma', 1, NULL, 'Two more weeks locked in. I told you. I TOLD you.', 1);
