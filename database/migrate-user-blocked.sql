-- Admin account block (Admin → Users). Blocked accounts cannot sign in, open sessions are
-- rejected, and automated mail skips them. They stay on every board.
-- Run on PlanetScale by hand. Re-run = duplicate column.
ALTER TABLE users
  ADD COLUMN blocked_at TIMESTAMP NULL;
