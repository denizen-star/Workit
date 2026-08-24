-- Run on PlanetScale by hand. Re-run = duplicate ignore.
INSERT IGNORE INTO badges (name, description, icon, requirement_type, requirement_value) VALUES
('Optional Weeks', 'Finish 4 warmups and 4 cooldowns in a week', '⏱️', 'optional_weeks', 1),
('Optionals', 'Finish an optional warmup or cooldown', '🔥', 'optionals', 1);
