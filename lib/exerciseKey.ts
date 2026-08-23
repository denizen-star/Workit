/** Same movement, different program names (gym vs travel / older hotel-week aliases). */

const GROUPS: string[][] = [
  [
    "Barbell or Dumbbell Bench Press",
    "Dumbbell Bench Press",
    "Push-Ups / Incline Push-Ups",
    "Push-Ups",
  ],
  [
    "Single-Arm Dumbbell Rows",
    "Standing Single-Arm DB Rows",
    "Towel Door Rows or Table Inverted Rows",
  ],
  ["Overhead Dumbbell Shoulder Press", "Standing DB Shoulder Press", "Pike Push-Ups"],
  [
    "Lat Pulldowns or Cable Rows",
    "Doorframe Towel Rows or Sliding Floor Lat Pulls",
  ],
  [
    "Triceps Cable Pushdowns or Overhead Extensions",
    "DB Triceps Extensions",
    "Bench Dips or Bodyweight Triceps Extensions",
  ],
  ["Incline Dumbbell Bench Press", "DB Incline Press"],
  ["Barbell or Chest-Supported Rows", "DB Chest-Supported or Bent-Over Rows"],
  [
    "Dumbbell Lateral Raises",
    "DB Lateral Raises",
    "Wall Lateral ISO Raises or Backpack Raises",
  ],
  ["Face Pulls", "Doorframe Rear Delt Flyes / Prone Y-T-W Raises"],
  [
    "Dumbbell Biceps Curls",
    "DB Biceps Curls",
    "Doorframe ISO Curls or Loaded Backpack Curls",
  ],
  [
    "Hanging Knee Raises or Ab Wheel Rollouts",
    "Floor Leg Raises or Bodyweight Wall Rollouts",
  ],
  [
    "Barbell Back Squats or Goblet Squats",
    "DB Goblet Squats",
    "Bodyweight Squats or Tempo Squats",
  ],
  [
    "Romanian Deadlifts (RDLs)",
    "DB Romanian Deadlifts",
    "Bodyweight Single-Leg RDLs",
    "DB Single-Leg RDLs",
  ],
  ["Walking Lunges", "DB Reverse Lunges", "Bodyweight Walking or Reverse Lunges"],
  [
    "Leg Curl Machine or Swiss Ball Hamstring Curls",
    "Lying Hamstring Floor Slides",
  ],
  [
    "Standing Calf Raises",
    "Bodyweight Calf Raises",
    "Single-Leg Bodyweight Calf Raises",
  ],
  ["Pallof Press", "Side Plank or Towel ISO Press"],
  ["Plank Hold", "Plank"],
  [
    "Trap Bar Deadlifts or Barbell Conventional Deadlifts",
    "Single-Leg Good Mornings or Heavy Object Deadlifts",
  ],
  [
    "Bulgarian Split Squats",
    "DB Bulgarian Split Squats",
    "Bodyweight Bulgarian Split Squats",
  ],
  [
    "Barbell Hip Thrusts or Glute Bridges",
    "Glute Bridges with DB on Hips",
    "Single-Leg Glute Bridges",
  ],
  [
    "Leg Extension Machine or Goblet Step-Ups",
    "Bodyweight Step-Ups or Sissy Squats",
  ],
  ["Farmer's Carries", "DB Farmer's Carry", "Loaded Water Jug / Backpack Carries"],
];

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/['’]/g, "'").replace(/\s+/g, " ");
}

const KEY_BY_NAME = new Map<string, string>();
const CANONICAL_BY_KEY = new Map<string, string>();
for (const group of GROUPS) {
  const key = normalizeName(group[0]);
  CANONICAL_BY_KEY.set(key, group[0]);
  for (const name of group) {
    KEY_BY_NAME.set(normalizeName(name), key);
  }
}

export function exerciseHistoryKey(name: string): string {
  const normalized = normalizeName(name);
  return KEY_BY_NAME.get(normalized) ?? normalized;
}

export function exerciseCanonicalName(name: string): string {
  const key = exerciseHistoryKey(name);
  return CANONICAL_BY_KEY.get(key) ?? name.trim();
}
