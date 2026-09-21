import { query } from '../lib/db';

async function main() {
  const rows = await query(
    `SELECT u.id, u.name,
       COUNT(DISTINCT ws.id) as workouts,
       COUNT(es.id) as sets,
       MAX(es.weight_lbs) as heaviest,
       AVG(es.hardness) as effort,
       SUM(CASE
         WHEN es.weight_lbs IS NULL OR es.actual_reps IS NULL THEN 0
         WHEN LOWER(COALESCE(es.target_reps, '')) LIKE '%second%' THEN es.weight_lbs
         ELSE es.weight_lbs * es.actual_reps
       END) as volume,
       SUM(CASE
         WHEN es.weight_lbs IS NULL OR es.actual_reps IS NULL THEN 0
         WHEN LOWER(COALESCE(es.target_reps, '')) LIKE '%second%' THEN es.weight_lbs
         ELSE es.weight_lbs * es.actual_reps
       END) * (COALESCE(AVG(es.hardness), 3) * 0.2) as effective_approx,
       SUM(es.weight_lbs) as weight_sum,
       SUM(es.actual_reps) as rep_sum
     FROM users u
     JOIN workout_sessions ws ON ws.user_id = u.id AND ws.is_completed = 1
       AND COALESCE(ws.completed_at, ws.ended_at) >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)
     LEFT JOIN exercise_sets es ON es.workout_session_id = ws.id AND es.is_completed = 1
     WHERE u.pin_hash IS NOT NULL AND u.name != 'Test'
     GROUP BY u.id, u.name
     ORDER BY workouts DESC, u.name`
  );
  console.log(JSON.stringify(rows.rows, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
