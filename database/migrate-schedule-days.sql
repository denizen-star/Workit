-- Select Days Per Week: athlete-chosen weekly training frequency (1-5, default 4).
-- Apply on PlanetScale by hand. Re-run = duplicate column errors (safe to ignore).

ALTER TABLE users
  ADD COLUMN schedule_days_per_week TINYINT UNSIGNED NOT NULL DEFAULT 4,
  ADD COLUMN schedule_days_asked_week INT NULL; -- last program week the 6-week re-ask was shown, NULL = never asked
