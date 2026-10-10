-- More than one focus (docs/plans/PLAN_FOCUS_ONBOARDING.md, phase 2): an athlete can pick
-- several focuses and their week alternates between them. users.focus and week_focus.focus
-- now hold a comma list in FOCUSES order, e.g. 'build,core'; a single value is unchanged.
-- Apply: npx tsx --env-file=.env.local scripts/apply-migration.ts migrate-focus-multi.sql
-- Re-run = safe (MODIFY to the same type is a no-op).

ALTER TABLE users MODIFY COLUMN focus VARCHAR(32) NOT NULL DEFAULT 'build';
ALTER TABLE week_focus MODIFY COLUMN focus VARCHAR(32) NOT NULL;
