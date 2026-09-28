-- Body weight history + bodyweight-movement credit (docs/plans/PLAN_BODY_WEIGHT.md).
-- body_weight_log: one dated row per body-weight save; users.body_weight_lb stays the
-- "current" value. exercise_sets.bodyweight_lb: the share of body weight credited to
-- that set when it completed (lib/bodyweightShare.ts), so a later weight change never
-- rewrites old sets. Volume = (weight_lbs + bodyweight_lb) × reps (lib/exerciseKind.ts).
-- Apply: npx tsx --env-file=.env.local scripts/apply-migration.ts migrate-body-weight.sql
-- (re-run = safe for the table/column; the seed INSERT would duplicate, so it only
-- inserts for users who have no log row yet).
CREATE TABLE IF NOT EXISTS body_weight_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  weight_lb DECIMAL(6, 1) NOT NULL,
  source VARCHAR(16) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_body_weight_user_time (user_id, created_at)
);

ALTER TABLE exercise_sets
  ADD COLUMN bodyweight_lb DECIMAL(6, 1) NULL;

-- Seed: the one weight already on file, dated to this migration.
INSERT INTO body_weight_log (user_id, weight_lb, source)
SELECT u.id, u.body_weight_lb, 'profile'
FROM users u
WHERE u.body_weight_lb IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM body_weight_log b WHERE b.user_id = u.id);
