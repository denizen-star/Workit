-- Hyrox Training track: opt-in 16-week program, replaces Home while active.
-- Already applied to PlanetScale. Re-run = duplicate table/column errors (safe to ignore).

-- One row per user tracking their active (or most recent) Hyrox run.
-- normal_week_at_start / normal_day_at_start snapshot the 48-week program position
-- so it can be restored (advanced by hyroxWeeksElapsed) when the athlete leaves.
CREATE TABLE IF NOT EXISTS hyrox_state (
    user_id INT NOT NULL PRIMARY KEY,
    active TINYINT(1) NOT NULL DEFAULT 0,
    hyrox_week INT NOT NULL DEFAULT 1,
    normal_week_at_start INT NOT NULL,
    normal_day_at_start INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Self-reported pass/fail per benchmark milestone. An athlete may retry, so
-- multiple rows per (user, milestone) are expected; latest attempt wins.
CREATE TABLE IF NOT EXISTS hyrox_milestones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    milestone_number TINYINT NOT NULL,
    result VARCHAR(8) NOT NULL, -- 'pass' | 'fail'
    decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_milestone (user_id, milestone_number)
);

-- Separate diploma track from the normal belt chest, one row per earned tier.
CREATE TABLE IF NOT EXISTS hyrox_diplomas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tier TINYINT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_tier (user_id, tier)
);

-- Marks which program a session belongs to, so scoreboard/badge queries that
-- already scan workout_sessions pick Hyrox sessions up for free.
ALTER TABLE workout_sessions
    ADD COLUMN program_track VARCHAR(16) NOT NULL DEFAULT 'main'; -- 'main' | 'hyrox'
