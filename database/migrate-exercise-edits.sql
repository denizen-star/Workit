-- Add / remove exercises (weeks 7–48, at the athlete's own risk): per-session edits,
-- {"removed": [program names], "added": [{name, sets, reps}]}. lib/exerciseEdits.ts.
ALTER TABLE workout_sessions
  ADD COLUMN exercise_edits JSON NULL;
