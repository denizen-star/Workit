-- Noise Control: lets an athlete turn down post-set flash takeovers, the
-- perceived-load flash, and the PR flash independently. Apply on PlanetScale
-- by hand; re-run = duplicate column.
ALTER TABLE users
  ADD COLUMN noise_takeover VARCHAR(16) NOT NULL DEFAULT 'set',
  ADD COLUMN noise_effort VARCHAR(16) NOT NULL DEFAULT 'set',
  ADD COLUMN show_prs TINYINT(1) NOT NULL DEFAULT 1;
