-- How an athlete arrived at /join: 'qr' (printed code, ?src=qr), 'link' (plain /join?h=…),
-- or 'invite' (claim link). Read by the nightly onboarding report (lib/emails/onboarding.ts).
-- Rows from before this column stay NULL and read as "unknown".
-- Apply: npx tsx --env-file=.env.local scripts/apply-migration.ts migrate-join-source.sql (re-run = safe).
ALTER TABLE users
  ADD COLUMN join_source VARCHAR(16) NULL;
