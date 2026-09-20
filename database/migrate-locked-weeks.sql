-- Locked weeks: a persisted "this week already met its bar" fact, one row per
-- (user, week), written once at the moment a week first locks and never removed
-- or downgraded. Belts / Hyrox eligibility read this table instead of recomputing
-- live against the athlete's CURRENT schedule_days_per_week -- without it, raising
-- your day count later would retroactively "unlock" (regress) weeks that were
-- genuinely completed under a lower requirement. See lib/lockedWeeks.ts.
-- Apply on PlanetScale by hand. Re-run = safe (CREATE TABLE IF NOT EXISTS,
-- INSERT IGNORE backfill).

CREATE TABLE IF NOT EXISTS locked_weeks (
    user_id INT NOT NULL,
    week_number INT NOT NULL,
    required_count TINYINT UNSIGNED NOT NULL,
    completed_count TINYINT UNSIGNED NOT NULL,
    locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, week_number)
);

-- Backfill: every week that already met the program's historical flat-4
-- requirement -- the only rule that has ever existed before schedule_days_per_week
-- shipped -- locks permanently at required_count = 4, regardless of what any
-- athlete's schedule_days_per_week is set to today. Excludes Hyrox sessions
-- (program_track = 'hyrox', week_number 101+): Hyrox weeks need 5, not 4, and
-- already have their own separate eligibility mechanism (lib/hyroxState.ts) --
-- counting them here would silently inflate the normal program's belt count.
INSERT IGNORE INTO locked_weeks (user_id, week_number, required_count, completed_count)
SELECT user_id, week_number, 4, COUNT(*)
FROM workout_sessions
WHERE is_completed = 1 AND program_track = 'main'
GROUP BY user_id, week_number
HAVING COUNT(*) >= 4;
