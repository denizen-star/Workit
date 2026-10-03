-- Skipped sets (docs/plans/PLAN_SKIPPED_SETS.md). A lifting set completed under 15s after
-- the session's previous completed set is stored completed but skipped: it finishes the
-- card yet counts for nothing (lib/skippedSets.ts `sqlSetCounts`). `completed_at` is the
-- first-completion time the 15s rule measures from (`created_at` is wrong for extras,
-- which are inserted before they complete). A session with half or more of its completed
-- sets skipped is `skipped_heavy` and does not count toward the week.
-- Rows from before this migration stay is_skipped = 0 (no backfill).
-- Apply: npx tsx --env-file=.env.local scripts/apply-migration.ts migrate-skipped-sets.sql (re-run = safe).
ALTER TABLE exercise_sets
  ADD COLUMN is_skipped TINYINT NOT NULL DEFAULT 0;
ALTER TABLE exercise_sets
  ADD COLUMN completed_at TIMESTAMP NULL;
ALTER TABLE workout_sessions
  ADD COLUMN skipped_heavy TINYINT NOT NULL DEFAULT 0;
