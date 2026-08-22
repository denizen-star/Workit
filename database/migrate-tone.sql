-- Already applied. Re-running fails with Duplicate column name 'coach_tone'. Skip this file.
ALTER TABLE users
  ADD COLUMN coach_tone VARCHAR(32) NOT NULL DEFAULT 'master';
