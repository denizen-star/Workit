import type { Exercise, WeekPlan, WorkoutDay } from '@/lib/workoutData';

const EXTRA_UPPER_PACKS: Exercise[][] = [
  [
    { name: 'Dumbbell or Barbell Shrugs', sets: 3, reps: '12-15', notes: 'Lighter than A and B.' },
    { name: 'Straight-Arm Pulldowns or Dumbbell Pullovers', sets: 3, reps: '10-12', notes: 'Lighter than A and B.' },
    { name: 'Lying Triceps Extensions (Skull Crushers)', sets: 3, reps: '10-12' },
    { name: 'Hammer Curls', sets: 3, reps: '10-12' },
    { name: 'Reverse Wrist Curls', sets: 3, reps: '12-15' },
  ],
  [
    { name: 'Dumbbell Lateral Raises', sets: 3, reps: '12-15', notes: 'Lighter than A and B.' },
    { name: 'Face Pulls', sets: 3, reps: '12-15' },
    { name: 'Dumbbell Biceps Curls', sets: 3, reps: '12' },
    { name: 'Triceps Cable Pushdowns or Overhead Extensions', sets: 3, reps: '12-15' },
    { name: 'Plank Hold', sets: 3, reps: '45 seconds' },
  ],
  [
    { name: 'Incline Dumbbell Bench Press', sets: 3, reps: '10-12', notes: 'Leave 2 in the tank.' },
    { name: 'Single-Arm Dumbbell Rows', sets: 3, reps: '10-12 per arm', notes: 'Leave 2 in the tank.' },
    { name: 'Face Pulls', sets: 3, reps: '12-15' },
    { name: 'Hammer Curls', sets: 3, reps: '10-12' },
    { name: 'Dead Bugs', sets: 3, reps: '8 per side' },
  ],
  [
    { name: 'Dumbbell or Barbell Shrugs', sets: 3, reps: '12-15' },
    { name: 'Dumbbell Lateral Raises', sets: 3, reps: '15' },
    { name: 'Lying Triceps Extensions (Skull Crushers)', sets: 3, reps: '10-12' },
    { name: 'Dumbbell Biceps Curls', sets: 3, reps: '12' },
    { name: 'Side Plank', sets: 3, reps: '30 seconds' },
  ],
  [
    { name: 'Straight-Arm Pulldowns or Dumbbell Pullovers', sets: 3, reps: '10-12' },
    { name: 'Face Pulls', sets: 3, reps: '15' },
    { name: 'Triceps Cable Pushdowns or Overhead Extensions', sets: 3, reps: '12-15' },
    { name: 'Hammer Curls', sets: 3, reps: '12' },
    { name: 'Pallof Press', sets: 3, reps: '12 per side' },
  ],
  [
    { name: 'Overhead Dumbbell Shoulder Press', sets: 3, reps: '10-12', notes: 'Leave 2 in the tank.' },
    { name: 'Barbell or Chest-Supported Rows', sets: 3, reps: '10-12', notes: 'Leave 2 in the tank.' },
    { name: 'Dumbbell Lateral Raises', sets: 3, reps: '12-15' },
    { name: 'Reverse Wrist Curls', sets: 3, reps: '12-15' },
    { name: 'Plank Hold', sets: 3, reps: '45 seconds' },
  ],
  [
    { name: 'Incline Dumbbell Bench Press', sets: 3, reps: '10-12', notes: 'Leave 2 in the tank.' },
    { name: 'Face Pulls', sets: 3, reps: '12-15' },
    { name: 'Dumbbell Biceps Curls', sets: 3, reps: '12' },
    { name: 'Lying Triceps Extensions (Skull Crushers)', sets: 3, reps: '12' },
    { name: 'Dead Bugs', sets: 3, reps: '8 per side' },
  ],
  [
    { name: 'Dumbbell or Barbell Shrugs', sets: 3, reps: '15' },
    { name: 'Straight-Arm Pulldowns or Dumbbell Pullovers', sets: 3, reps: '12' },
    { name: 'Hammer Curls', sets: 3, reps: '12' },
    { name: 'Triceps Cable Pushdowns or Overhead Extensions', sets: 3, reps: '12-15' },
    { name: 'Side Plank', sets: 3, reps: '30 seconds' },
  ],
];

function cloneExercises(exercises: Exercise[], note?: string): Exercise[] {
  return exercises.map((exercise) => ({
    ...exercise,
    notes: note ?? exercise.notes,
  }));
}

function blockFor(weekNumber: number) {
  const easy = weekNumber % 6 === 0;
  if (easy) {
    return {
      title: 'Easier week',
      note: 'Easier week. Hold the load. How hard 2 to 3.',
    };
  }
  if (weekNumber <= 12) {
    return {
      title: 'Settle',
      note: 'Same bar or a small add. How hard 2 to 3.',
    };
  }
  if (weekNumber <= 24) {
    return {
      title: 'Build',
      note: 'Add 2.5-5 lb or 1-2 reps. How hard 3 to 4.',
    };
  }
  if (weekNumber <= 36) {
    return {
      title: 'Weigh-up',
      note: 'Beat your week-24 numbers. How hard 3 to 5 on compounds.',
    };
  }
  return {
    title: 'Keep',
    note: 'Hold the habit. How hard 2 to 4.',
  };
}

function bonusCore(): WorkoutDay {
  return {
    dayNumber: 5,
    name: 'Bonus Core',
    focus: 'Core and engine',
    suggestedDay: 'Saturday',
    bonus: true,
    exercises: [
      { name: 'Dead Bugs', sets: 3, reps: '8 per side' },
      { name: 'Side Plank', sets: 3, reps: '30 seconds' },
      { name: 'Plank Hold', sets: 3, reps: '45 seconds' },
      { name: 'Pallof Press', sets: 3, reps: '12 per side' },
    ],
  };
}

/** Weeks 7 to 48 from week-6 compounds. Odd week Lower A, even week Lower B. Extra upper rotates every 6 weeks. */
export function buildYearWeeks(firstSix: WeekPlan[]): WeekPlan[] {
  const source = firstSix.find((week) => week.weekNumber === 6);
  if (!source) return [];
  const upperA = source.days.find((day) => day.dayNumber === 1);
  const lowerA = source.days.find((day) => day.dayNumber === 2);
  const upperB = source.days.find((day) => day.dayNumber === 3);
  const lowerB = source.days.find((day) => day.dayNumber === 4);
  if (!upperA || !lowerA || !upperB || !lowerB) return [];

  const weeks: WeekPlan[] = [];
  for (let weekNumber = 7; weekNumber <= 48; weekNumber += 1) {
    const block = blockFor(weekNumber);
    const lower = weekNumber % 2 === 1 ? lowerA : lowerB;
    const pack = EXTRA_UPPER_PACKS[Math.floor((weekNumber - 7) / 6) % EXTRA_UPPER_PACKS.length];
    weeks.push({
      weekNumber,
      description: `${block.title}. One lower (${lower.name}). Extra upper Friday. How hard is a suggestion only.`,
      days: [
        {
          ...upperA,
          exercises: cloneExercises(upperA.exercises, block.note),
        },
        {
          ...lower,
          dayNumber: 2,
          suggestedDay: 'Tuesday',
          exercises: cloneExercises(lower.exercises, block.note),
        },
        {
          ...upperB,
          dayNumber: 3,
          exercises: cloneExercises(upperB.exercises, block.note),
        },
        {
          dayNumber: 4,
          name: 'Extra Upper',
          focus: 'Arms and rear delts',
          suggestedDay: 'Friday',
          exercises: cloneExercises(pack, block.note),
        },
        bonusCore(),
      ],
    });
  }
  return weeks;
}
