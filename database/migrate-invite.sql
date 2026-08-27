-- Run on PlanetScale by hand. Re-run = duplicate column.
ALTER TABLE users
  ADD COLUMN invited_by INT NULL,
  ADD COLUMN invite_token VARCHAR(64) NULL,
  ADD COLUMN invited_at TIMESTAMP NULL;

CREATE UNIQUE INDEX idx_users_invite_token ON users (invite_token);
CREATE INDEX idx_users_invited_by ON users (invited_by);
