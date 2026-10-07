-- Workout reminder push notifications (docs/plans/PLAN_PUSH_REMINDERS.md).
-- users: the athlete's reminder settings. reminder_time is local HH:MM (15-minute steps),
-- reminder_tz the browser's IANA zone, reminder_days 7 chars Mon→Sun ('1' = remind that day).
-- reminder_banner_dismissed_at folds the menu's Reminders section to one line (account-wide).
-- push_subscriptions: one row per device (a browser's push endpoint). push_log: one claim per
-- user per local date, so a reminder sends at most once a day.
-- Run: npx tsx --env-file=.env.local scripts/apply-migration.ts migrate-push-reminders.sql
-- Re-run = safe (duplicate columns are skipped, tables are IF NOT EXISTS).
ALTER TABLE users ADD COLUMN reminder_time VARCHAR(5) NULL;
ALTER TABLE users ADD COLUMN reminder_tz VARCHAR(64) NULL;
ALTER TABLE users ADD COLUMN reminders_on TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN reminder_days CHAR(7) NOT NULL DEFAULT '1111111';
ALTER TABLE users ADD COLUMN reminder_banner_dismissed_at TIMESTAMP NULL;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  endpoint VARCHAR(512) NOT NULL,
  subscription JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_push_endpoint (endpoint),
  INDEX idx_push_user (user_id)
);

CREATE TABLE IF NOT EXISTS push_log (
  user_id INT NOT NULL,
  for_date DATE NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, for_date)
);
