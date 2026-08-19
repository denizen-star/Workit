-- Workout Tracker Database Schema for PlanetScale MySQL

-- Users table (simple single-user for now, can be expanded)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Workout sessions table
CREATE TABLE workout_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    week_number INT NOT NULL,
    day_number INT NOT NULL,
    workout_type VARCHAR(100) NOT NULL, -- 'Upper Body A', 'Lower Body B', etc.
    scheduled_date DATE,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP,
    ended_at TIMESTAMP NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_week (user_id, week_number),
    INDEX idx_completed (user_id, is_completed)
);

-- Exercise sets table (tracks each set of each exercise)
CREATE TABLE exercise_sets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workout_session_id INT NOT NULL,
    exercise_name VARCHAR(255) NOT NULL,
    set_number INT NOT NULL,
    target_reps VARCHAR(50), -- e.g., "8-10", "12-15"
    actual_reps INT,
    weight_lbs DECIMAL(6,2),
    is_completed BOOLEAN DEFAULT FALSE,
    rest_timer_seconds INT DEFAULT 90,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session (workout_session_id),
    FOREIGN KEY (workout_session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
);

-- Badges table
CREATE TABLE badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    requirement_type VARCHAR(100), -- 'first_workout', 'week_complete', 'streak', 'weight_milestone'
    requirement_value INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User badges (earned badges)
CREATE TABLE user_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_badge (user_id, badge_id),
    INDEX idx_user (user_id),
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
);

-- Daily stats (for quick dashboard queries)
CREATE TABLE daily_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workout_date DATE NOT NULL,
    total_exercises_completed INT DEFAULT 0,
    total_sets_completed INT DEFAULT 0,
    total_weight_lifted DECIMAL(10,2) DEFAULT 0,
    workout_duration_minutes INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_date (user_id, workout_date),
    INDEX idx_user_date (user_id, workout_date)
);

-- Insert default badges
INSERT INTO badges (name, description, icon, requirement_type, requirement_value) VALUES
('First Steps', 'Complete your first workout', '🎯', 'first_workout', 1),
('Week Warrior', 'Complete all workouts in a week', '🏆', 'week_complete', 4),
('Two Week Streak', 'Complete 2 consecutive weeks', '🔥', 'streak', 2),
('Iron Lifter', 'Lift 5,000 lbs in total', '💪', 'weight_milestone', 5000),
('Steel Lifter', 'Lift 10,000 lbs in total', '⚡', 'weight_milestone', 10000),
('Titan Lifter', 'Lift 20,000 lbs in total', '👑', 'weight_milestone', 20000),
('Consistency King', 'Complete 3 consecutive weeks', '🌟', 'streak', 3),
('Program Complete', 'Finish all 6 weeks', '🎖️', 'program_complete', 6),
('Perfect Week', 'Complete all exercises in a week with no missed sets', '💎', 'perfect_week', 1),
('Dedication', 'Complete 20 total workouts', '🎗️', 'total_workouts', 20);

-- Insert default user (can be modified)
INSERT INTO users (name, email) VALUES ('Workout User', 'user@workit.kervinapps.com');
