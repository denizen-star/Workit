ALTER TABLE workout_sessions
  ADD COLUMN workout_mode VARCHAR(16) NOT NULL DEFAULT 'gym';

UPDATE badges
  SET description = 'Finish 4 travel-mode sessions'
  WHERE requirement_type = 'travel_week';
