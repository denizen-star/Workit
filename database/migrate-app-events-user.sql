-- Identified Work-It rows on shared kervapps.app_events.
-- Apply on PlanetScale by hand. Re-run = duplicate column / index error.

ALTER TABLE app_events
  ADD COLUMN user_id INT NULL,
  ADD COLUMN user_name VARCHAR(255) NULL,
  ADD COLUMN user_email VARCHAR(255) NULL;

CREATE INDEX idx_app_events_app_user_ts
  ON app_events (app_name, user_id, timestamp);
