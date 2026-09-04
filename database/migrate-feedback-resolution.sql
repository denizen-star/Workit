-- Close reason on feedback. Open = resolved_at NULL. Done = resolved_at + resolution done
-- (or resolution NULL on old rows). Won't do = resolution wont_do.
-- Apply on PlanetScale by hand. Re-run = duplicate column.

ALTER TABLE feedback
  ADD COLUMN resolution VARCHAR(16) NULL;

UPDATE feedback
SET resolution = 'done'
WHERE resolved_at IS NOT NULL AND resolution IS NULL;
