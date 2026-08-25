-- Run on PlanetScale by hand. Re-run = duplicate column.
ALTER TABLE exercise_sets
  ADD COLUMN hardness TINYINT NULL;
