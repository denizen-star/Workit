/** Same movement, different program names (gym week vs travel week). */

const GROUPS: string[][] = [
  ["Barbell or Dumbbell Bench Press", "Dumbbell Bench Press"],
  ["Single-Arm Dumbbell Rows", "Standing Single-Arm DB Rows"],
  ["Overhead Dumbbell Shoulder Press", "Standing DB Shoulder Press"],
  ["Incline Dumbbell Bench Press", "DB Incline Press"],
  ["Barbell or Chest-Supported Rows", "DB Chest-Supported or Bent-Over Rows"],
  ["Dumbbell Lateral Raises", "DB Lateral Raises"],
  ["Dumbbell Biceps Curls", "DB Biceps Curls"],
  ["Barbell Back Squats or Goblet Squats", "DB Goblet Squats"],
  ["Romanian Deadlifts (RDLs)", "DB Romanian Deadlifts"],
  ["Walking Lunges", "DB Reverse Lunges"],
  ["Standing Calf Raises", "Bodyweight Calf Raises"],
  ["Plank Hold", "Plank"],
  ["Bulgarian Split Squats", "DB Bulgarian Split Squats"],
  ["Barbell Hip Thrusts or Glute Bridges", "Glute Bridges with DB on Hips"],
  ["Farmer's Carries", "DB Farmer's Carry"],
];

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/['’]/g, "'").replace(/\s+/g, " ");
}

const KEY_BY_NAME = new Map<string, string>();
for (const group of GROUPS) {
  const key = normalizeName(group[0]);
  for (const name of group) {
    KEY_BY_NAME.set(normalizeName(name), key);
  }
}

export function exerciseHistoryKey(name: string): string {
  const normalized = normalizeName(name);
  return KEY_BY_NAME.get(normalized) ?? normalized;
}
