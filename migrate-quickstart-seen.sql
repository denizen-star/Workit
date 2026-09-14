-- Quickstart takeover: shown once to a brand-new athlete right after login
-- (after the waiver gate, if one was needed), then never again. NULL = not
-- seen yet. Apply on PlanetScale by hand; re-run = duplicate column.
ALTER TABLE users
  ADD COLUMN quickstart_seen_at DATETIME NULL;
