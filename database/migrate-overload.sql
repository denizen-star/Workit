-- Overload Progressions: opt-in 6-week hypertrophy track (docs/plans/PLAN_OVERLOAD_PROGRESSIONS.md).
-- Apply: npx tsx --env-file=.env.local scripts/apply-migration.ts migrate-overload.sql
-- Re-run = safe (CREATE TABLE IF NOT EXISTS). Coach lines for the new buckets
-- (overload_start / overload_diploma) ship in migrate-overload-coach-lines.sql.
--
-- workout_sessions.program_track (VARCHAR(16), migrate-hyrox.sql) already fits
-- 'overload' — no column change. Overload weeks are namespaced per run at 201+
-- (lib/overloadProgram.ts: run 1 = 201-206, run 2 = 211-216, ...) so a repeat run
-- never collides with an earlier one in locked_weeks (PK user+week).

-- One row per user: the active (or most recent) run.
-- starts_on is the Eastern Monday the run's week 1 begins; until then the athlete
-- keeps training the main program. normal_week_at_start / normal_day_at_start
-- snapshot the 48-week position; on leave, normal_week_at_start is overwritten
-- with the resume floor (start + weeks locked this run), same as hyrox_state.
CREATE TABLE IF NOT EXISTS overload_state (
    user_id INT NOT NULL PRIMARY KEY,
    active TINYINT(1) NOT NULL DEFAULT 0,
    run_number INT NOT NULL DEFAULT 1,
    starts_on DATE NOT NULL,
    normal_week_at_start INT NOT NULL,
    normal_day_at_start INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Diploma tiers 1-3, earned when calendar weeks 2 / 4 / 6 of a run end while the
-- athlete is still in it. seen_at gates the one-time Home takeover.
CREATE TABLE IF NOT EXISTS overload_diplomas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    run_number INT NOT NULL,
    tier TINYINT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    seen_at TIMESTAMP NULL,
    UNIQUE KEY unique_user_run_tier (user_id, run_number, tier)
);
