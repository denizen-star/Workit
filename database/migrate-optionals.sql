-- Run on PlanetScale by hand. Re-run = duplicate column.
ALTER TABLE workout_sessions
  ADD COLUMN warmup_track VARCHAR(16) NULL,
  ADD COLUMN warmup_started_at TIMESTAMP NULL,
  ADD COLUMN warmup_completed_at TIMESTAMP NULL,
  ADD COLUMN warmup_lbs DECIMAL(8,2) NOT NULL DEFAULT 0,
  ADD COLUMN cooldown_track VARCHAR(16) NULL,
  ADD COLUMN cooldown_started_at TIMESTAMP NULL,
  ADD COLUMN cooldown_completed_at TIMESTAMP NULL,
  ADD COLUMN cooldown_lbs DECIMAL(8,2) NOT NULL DEFAULT 0,
  ADD COLUMN optional_kicker_lbs DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN optional_kicker_at TIMESTAMP NULL;
