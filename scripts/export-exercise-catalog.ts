import { workoutProgram } from '@/lib/workoutData';
import { getExerciseImages } from '@/lib/exerciseImages';
import { getExerciseMedia } from '@/lib/exerciseMedia';

type Row = {
  name: string;
  source: 'free-exercise-db' | 'unsplash-fallback';
  start: string;
  end?: string;
};

const seen = new Map<string, Row>();

for (const week of workoutProgram) {
  for (const day of week.days) {
    for (const exercise of day.exercises) {
      if (seen.has(exercise.name)) continue;
      const fx = getExerciseImages(exercise.name);
      if (fx) {
        seen.set(exercise.name, { name: exercise.name, source: 'free-exercise-db', start: fx.start, end: fx.end });
      } else {
        const media = getExerciseMedia(exercise.name);
        seen.set(exercise.name, { name: exercise.name, source: 'unsplash-fallback', start: media.images[0] });
      }
    }
  }
}

const rows = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
process.stdout.write(JSON.stringify(rows, null, 2));
