-- Records when a joiner tapped "I confirm" on /join's agree screen (18+ and train at your own risk).
-- Set on new-user insert and on invite claim in app/api/join/route.ts. Existing athletes stay NULL.
-- Run on PlanetScale by hand. Re-run = duplicate column.
ALTER TABLE users
  ADD COLUMN adult_risk_confirmed_at TIMESTAMP NULL;
