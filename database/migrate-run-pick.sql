-- Run as a Your pick type (10 / 20 / 30 min, flat 500 / 1,000 / 1,500 lb credit).
-- No column changes: pick_type 'run' fits VARCHAR(8); length lives in day_number 25/26/27.
-- Apply: npx tsx --env-file=.env.local scripts/apply-migration.ts migrate-run-pick.sql
-- Re-run = safe (INSERT IGNORE).
INSERT IGNORE INTO badges (name, description, icon, requirement_type, requirement_value) VALUES
('First Run', 'Finish your first Your pick run', '🏃', 'pick_run', 1);
