-- Run on PlanetScale by hand. Re-run = duplicate column / table.
ALTER TABLE users
  ADD COLUMN first_name VARCHAR(120) NULL,
  ADD COLUMN last_name VARCHAR(120) NULL,
  ADD COLUMN display_name VARCHAR(120) NULL,
  ADD COLUMN phone VARCHAR(32) NULL,
  ADD COLUMN body_weight_lb DECIMAL(6, 1) NULL,
  ADD COLUMN photo MEDIUMBLOB NULL,
  ADD COLUMN waiver_text MEDIUMTEXT NULL,
  ADD COLUMN waiver_accepted_at TIMESTAMP NULL,
  ADD COLUMN email_verified_at TIMESTAMP NULL,
  ADD COLUMN last_household_id INT NULL;

CREATE TABLE households (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  public_join TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE household_members (
  household_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (household_id, user_id),
  INDEX idx_household_members_user (user_id)
);

INSERT INTO households (slug, name, public_join) VALUES
  ('og', 'The OG', 0),
  ('gowanus', 'Gowanus', 1);

INSERT INTO household_members (household_id, user_id)
SELECT h.id, u.id
FROM households h
CROSS JOIN users u
WHERE h.slug = 'og';

UPDATE users
SET
  last_household_id = (SELECT id FROM households WHERE slug = 'og' LIMIT 1),
  first_name = SUBSTRING_INDEX(TRIM(name), ' ', 1),
  display_name = NULL,
  email_verified_at = CASE WHEN pin_hash IS NOT NULL THEN UTC_TIMESTAMP() ELSE email_verified_at END
WHERE last_household_id IS NULL;

INSERT INTO users (name, email, pin_hash, coach_tone, sound_on, first_name, display_name, email_verified_at, waiver_accepted_at)
SELECT
  'Test',
  'test.gowanus@workitapp.fit',
  pin_hash,
  'luna',
  1,
  'Test',
  'Test',
  UTC_TIMESTAMP(),
  UTC_TIMESTAMP()
FROM users
WHERE LOWER(TRIM(name)) = 'test'
  AND email != 'test.gowanus@workitapp.fit'
LIMIT 1;

INSERT INTO household_members (household_id, user_id)
SELECT h.id, 1
FROM households h
WHERE h.slug = 'gowanus'
  AND NOT EXISTS (
    SELECT 1 FROM household_members m WHERE m.household_id = h.id AND m.user_id = 1
  );

INSERT INTO household_members (household_id, user_id)
SELECT h.id, u.id
FROM households h
JOIN users u ON u.email = 'test.gowanus@workitapp.fit'
WHERE h.slug = 'gowanus';
