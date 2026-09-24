// Checks that every loggable exercise name has a Push / Pull / Legs / Core pattern
// (lib/movementPattern.ts), or is deliberately pattern-less (cardio, conditioning,
// mobility). Run: npx tsx scripts/check-movement-pattern-coverage.ts
import { ALT_EXERCISES } from '../lib/altExercises';
import { hyroxProgram } from '../lib/hyroxProgram';
import { MOVEMENT_LIBRARY } from '../lib/movementLibrary';
import { hasExplicitPattern, movementPattern } from '../lib/movementPattern';
import { toTravelExercise } from '../lib/travelExercises';
import { programWithRetiredDays, type Exercise } from '../lib/workoutData';
import { isTimedPickType, yourPickDay, YOUR_PICK_TYPES } from '../lib/yourPick';

/** Deliberately no pill: cardio, conditioning and mobility. */
const NO_PATTERN = new Set([
  '12-Min AMRAP',
  '15-Min AMRAP',
  '5K Continuous Run',
  'Continuous Easy Run',
  'Run',
  'Easy Bike or Walk',
  'Easy Row (SkiErg or Rower)',
  'Foam Rolling + Mobility Flow',
  'Burpees',
  'Burpee Broad Jumps',
]);

const names = new Set<string>();
const add = (exercise: Exercise) => {
  names.add(exercise.name);
  names.add(toTravelExercise(exercise).name);
};
for (const week of [...programWithRetiredDays, ...hyroxProgram]) week.days.forEach((day) => day.exercises.forEach(add));
for (let week = 1; week <= 48; week += 1) {
  for (const type of YOUR_PICK_TYPES) if (!isTimedPickType(type)) yourPickDay(week, type).exercises.forEach(add);
}
for (const [name, alts] of Object.entries(ALT_EXERCISES)) [name, ...alts].forEach((item) => names.add(item));

const missing = [...names].filter((name) => !hasExplicitPattern(name) && !NO_PATTERN.has(name)).sort();
const library = MOVEMENT_LIBRARY.filter(
  (entry) => (entry.group === 'main' || entry.group === 'hyrox') && !NO_PATTERN.has(entry.name)
).filter((entry) => movementPattern(entry.name, entry.muscleGroup) == null && entry.muscleGroup !== 'Cardio' && entry.muscleGroup !== 'Mobility' && entry.muscleGroup !== 'Full Body');

console.log(`${names.size} program/travel/alt/Your pick names checked.`);
if (missing.length || library.length) {
  console.log('Missing a pattern:\n' + [...missing, ...library.map((entry) => entry.name)].join('\n'));
  process.exitCode = 1;
} else {
  console.log('Every name has a pattern (or is deliberately cardio/conditioning/mobility).');
}
