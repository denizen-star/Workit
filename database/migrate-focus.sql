-- Focus setup (docs/plans/PLAN_FOCUS_ONBOARDING.md): the athlete's training focus.
-- users.focus: build | core | home | travel. 'build' = the original program, so every
-- existing athlete keeps today's behavior until they choose otherwise.
-- users.focus_chosen_at: NULL until the athlete has seen the setup step (gates the one-time
-- Home takeover for existing athletes; "Continue as is" also stamps it).
-- week_focus: a one-week override ("this week I want Home"). PK on user + week, so a week
-- holds one choice; the athlete default (users.focus) applies to every week without a row.
-- Apply: npx tsx --env-file=.env.local scripts/apply-migration.ts migrate-focus.sql
-- Re-run = safe (duplicate column / existing table are skipped).

ALTER TABLE users ADD COLUMN focus VARCHAR(8) NOT NULL DEFAULT 'build';
ALTER TABLE users ADD COLUMN focus_chosen_at TIMESTAMP NULL;

CREATE TABLE IF NOT EXISTS week_focus (
  user_id INT NOT NULL,
  week_number INT NOT NULL,
  focus VARCHAR(8) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, week_number)
);
