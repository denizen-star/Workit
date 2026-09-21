import { workoutProgram } from '@/lib/workoutData';
import { hyroxProgram } from '@/lib/hyroxProgram';
import { toTravelExercise } from '@/lib/travelExercises';

const names = new Set<string>();

for (const week of workoutProgram) {
  for (const day of week.days) {
    for (const exercise of day.exercises) {
      names.add(exercise.name);
      names.add(toTravelExercise(exercise).name);
    }
  }
}
for (const week of hyroxProgram) {
  for (const day of week.days) {
    for (const exercise of day.exercises) {
      names.add(exercise.name);
    }
  }
}

const combos = [...names].filter((n) => / or | \/ /.test(n)).sort();
process.stdout.write(combos.join('\n') + '\n');
