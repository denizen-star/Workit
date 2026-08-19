ALTER TABLE workout_sessions ADD COLUMN started_at TIMESTAMP NULL;
ALTER TABLE workout_sessions ADD COLUMN ended_at TIMESTAMP NULL;
UPDATE workout_sessions SET started_at = created_at WHERE started_at IS NULL;
