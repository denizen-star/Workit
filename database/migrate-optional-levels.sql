-- Run on PlanetScale by hand. Re-run = duplicate column.
ALTER TABLE workout_sessions
  ADD COLUMN warmup_level VARCHAR(8) NULL,
  ADD COLUMN cooldown_level VARCHAR(8) NULL;
