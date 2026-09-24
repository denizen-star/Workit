-- Your pick (replaces the bonus day) — docs/plans/PLAN_YOUR_PICK.md.
-- Apply: npx tsx --env-file=.env.local scripts/apply-your-pick-migration.ts
-- Re-run = safe (the runner skips duplicate columns; badge rows are INSERT IGNORE).

-- Which Your pick this session is: upper | lower | yoga | core | full. NULL = a program day.
ALTER TABLE workout_sessions ADD COLUMN pick_type VARCHAR(8) NULL;

-- How it ran: sets (Upper/Lower/Full body) | timed (Yoga/Core tap-through) | done (Yoga/Core mark done).
ALTER TABLE workout_sessions ADD COLUMN pick_mode VARCHAR(8) NULL;

-- Program day_number this session stands in for (a swap). NULL = an add.
ALTER TABLE workout_sessions ADD COLUMN swap_for_day INT NULL;

-- Yoga/Core credit: 7-day average session volume × effort factor, set at Finish.
-- Flows everywhere optional lbs flow (sqlSessionOptionalVolume in lib/optionals.ts).
ALTER TABLE workout_sessions ADD COLUMN credit_lbs DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Whole-session How hard (1-5, averaged across per-hold + end ratings) for Yoga/Core.
ALTER TABLE workout_sessions ADD COLUMN session_hardness DECIMAL(3,2) NULL;

INSERT IGNORE INTO badges (name, description, icon, requirement_type, requirement_value) VALUES
('Your Pick', 'Finish your first Your pick workout', '🎲', 'pick_sessions', 1),
('Picky Ten', 'Finish 10 Your pick workouts', '🎲', 'pick_sessions', 10),
('Picky Twenty-Five', 'Finish 25 Your pick workouts', '🎲', 'pick_sessions', 25),
('Full Menu', 'Finish every Your pick type: upper, lower, yoga, core, full body', '🍽️', 'pick_all_types', 5),
('Ten Flows', 'Finish 10 Your pick yoga sessions', '🧘', 'pick_yoga', 10),
('Ten Lowers', 'Finish 10 Your pick lower sessions', '🦵', 'pick_lower', 10),
('Picked and Locked', 'Lock a week with a Your pick in it', '🔒', 'pick_locked_week', 1);

-- Bonus Day now counts weeks a Your pick went past the required count (plus past bonus days).
UPDATE badges SET description = 'Go past your week with a Your pick' WHERE requirement_type = 'bonus_sessions';
