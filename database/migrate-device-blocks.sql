-- Browser blocks. A row per /join "Under 18 / Pass" tap (user_id NULL) or per admin account
-- block (user_id set). The browser holds a signed cookie with this id (lib/deviceBlock.ts);
-- cleared_at lets Kevin release it from Admin → Users, and the browser frees itself on /blocked.
-- Run on PlanetScale by hand. Re-run = safe (IF NOT EXISTS).
CREATE TABLE IF NOT EXISTS device_blocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  request_email VARCHAR(255) NULL,
  request_note TEXT NULL,
  requested_at TIMESTAMP NULL,
  cleared_at TIMESTAMP NULL,
  INDEX idx_device_blocks_user (user_id)
);
