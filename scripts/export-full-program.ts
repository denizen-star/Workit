import { workoutProgram } from '@/lib/workoutData';
import { toTravelExercise } from '@/lib/travelExercises';

const csvEscape = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

const rows: string[] = ['Week,Workout,Gym Exercise,Travel Exercise,# Sets'];

for (const week of workoutProgram) {
  for (const day of week.days) {
    for (const exercise of day.exercises) {
      const travel = toTravelExercise(exercise);
      rows.push(
        [
          String(week.weekNumber),
          csvEscape(day.name),
          csvEscape(exercise.name),
          csvEscape(travel.name),
          String(exercise.sets),
        ].join(','),
      );
    }
  }
}

process.stdout.write(rows.join('\n') + '\n');
