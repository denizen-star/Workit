import { workoutProgram } from '@/lib/workoutData';
import { hyroxProgram } from '@/lib/hyroxProgram';

const main = new Set<string>();
for (const week of workoutProgram) for (const day of week.days) for (const ex of day.exercises) main.add(ex.name);

const hyrox = new Set<string>();
for (const week of hyroxProgram) for (const day of week.days) for (const ex of day.exercises) hyrox.add(ex.name);

process.stdout.write('MAIN (' + main.size + ')\n' + [...main].sort().join('\n') + '\n\n');
process.stdout.write('HYROX (' + hyrox.size + ')\n' + [...hyrox].sort().join('\n') + '\n');
