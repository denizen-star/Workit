-- Weekly gold / silver / bronze. Eastern Mon–Sun, closed weeks only.
-- Run on PlanetScale by hand. Re-run = duplicate table.
CREATE TABLE week_podium (
  id INT AUTO_INCREMENT PRIMARY KEY,
  week_monday DATE NOT NULL,
  place TINYINT NOT NULL,
  user_id INT NOT NULL,
  workouts INT NOT NULL DEFAULT 0,
  volume DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_week_place (week_monday, place),
  INDEX idx_user_week (user_id, week_monday)
);
