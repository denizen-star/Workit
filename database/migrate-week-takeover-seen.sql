-- Server-side "have you dismissed this takeover" tracking for the week-podium and
-- week-miss Home takeovers. Replaces the old localStorage-only gate (lib/weekPodiumSeen.ts),
-- which reset per device/browser instead of following the account.
-- Run on PlanetScale by hand. Re-run = duplicate table.
CREATE TABLE week_takeover_seen (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  week_monday DATE NOT NULL,
  kind VARCHAR(16) NOT NULL, -- 'podium' | 'miss'
  seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_week_kind (user_id, week_monday, kind)
);
