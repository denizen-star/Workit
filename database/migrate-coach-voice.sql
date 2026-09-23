-- Coach speech on/off. Separate from users.sound_on (chimes and the horn).
-- Re-run = duplicate column.
ALTER TABLE users
  ADD COLUMN coach_voice_on TINYINT(1) NOT NULL DEFAULT 1;
