-- Household feedback (Talk to me notes + per-exercise thumbs) and session star ratings.
-- Run on PlanetScale by hand. Unique (user_id, session_id, exercise_name) locks one thumb
-- per exercise per session. Notes leave those columns NULL so many notes can land.

CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  kind VARCHAR(16) NOT NULL,
  topic VARCHAR(32) NULL,
  reason VARCHAR(32) NULL,
  message TEXT NOT NULL,
  exercise_name VARCHAR(255) NULL,
  session_id INT NULL,
  page_url TEXT NULL,
  mailed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_feedback_user (user_id),
  INDEX idx_feedback_kind (kind),
  INDEX idx_feedback_session (session_id),
  INDEX idx_feedback_mailed (mailed_at),
  UNIQUE KEY uniq_feedback_thumb (user_id, session_id, exercise_name)
);

CREATE TABLE IF NOT EXISTS session_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_id INT NOT NULL,
  stars TINYINT NOT NULL,
  outcome VARCHAR(16) NOT NULL,
  week_number INT NOT NULL,
  day_number INT NOT NULL,
  workout_type VARCHAR(100) NOT NULL,
  workout_mode VARCHAR(16) NOT NULL DEFAULT 'gym',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_session_rating (session_id),
  INDEX idx_rating_user (user_id),
  INDEX idx_rating_week (week_number),
  INDEX idx_rating_type (workout_type),
  INDEX idx_rating_mode (workout_mode),
  INDEX idx_rating_outcome (outcome)
);
