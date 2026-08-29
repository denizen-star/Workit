/** Start/end form photos from free-exercise-db (matched by program exercise name). */
const IMAGE_MAP: Record<string, { start: string; end: string }> = {
  "Barbell or Dumbbell Bench Press": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/1.jpg",
  },
  "Single-Arm Dumbbell Rows": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One-Arm_Dumbbell_Row/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One-Arm_Dumbbell_Row/1.jpg",
  },
  "Overhead Dumbbell Shoulder Press": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shoulder_Press/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shoulder_Press/1.jpg",
  },
  "Lat Pulldowns or Cable Rows": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/1.jpg",
  },
  "Triceps Cable Pushdowns or Overhead Extensions": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown/1.jpg",
  },
  "Plank Hold": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/1.jpg",
  },
  Plank: {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/1.jpg",
  },
  "Barbell Back Squats or Goblet Squats": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Full_Squat/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Goblet_Squat/0.jpg",
  },
  "Romanian Deadlifts (RDLs)": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/1.jpg",
  },
  "Walking Lunges": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Walking_Lunge/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Walking_Lunge/1.jpg",
  },
  "Leg Curl Machine or Swiss Ball Hamstring Curls": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Leg_Curls/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Leg_Curls/1.jpg",
  },
  "Standing Calf Raises": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Calf_Raises/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Calf_Raises/1.jpg",
  },
  "Pallof Press": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pallof_Press/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pallof_Press/1.jpg",
  },
  "Incline Dumbbell Bench Press": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Press/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Press/1.jpg",
  },
  "Barbell or Chest-Supported Rows": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/1.jpg",
  },
  "Dumbbell Lateral Raises": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Lateral_Raise/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Lateral_Raise/1.jpg",
  },
  "Face Pulls": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Face_Pull/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Face_Pull/1.jpg",
  },
  "Dumbbell Biceps Curls": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bicep_Curl/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bicep_Curl/1.jpg",
  },
  "Hanging Knee Raises or Ab Wheel Rollouts": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hanging_Leg_Raise/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hanging_Leg_Raise/1.jpg",
  },
  "Trap Bar Deadlifts or Barbell Conventional Deadlifts": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/1.jpg",
  },
  "Bulgarian Split Squats": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Split_Squat_with_Dumbbells/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Split_Squat_with_Dumbbells/1.jpg",
  },
  "Barbell Hip Thrusts or Glute Bridges": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hip_Thrust/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hip_Thrust/1.jpg",
  },
  "Leg Extension Machine or Goblet Step-Ups": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Extensions/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Extensions/1.jpg",
  },
  "Farmer's Carries": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Farmers_Walk/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Farmers_Walk/1.jpg",
  },
  "Dumbbell or Barbell Shrugs": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shrug/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shrug/1.jpg",
  },
  "Straight-Arm Pulldowns or Dumbbell Pullovers": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Straight-Arm_Pulldown/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Pullover/1.jpg",
  },
  "Lying Triceps Extensions (Skull Crushers)": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Triceps_Press/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Triceps_Press/1.jpg",
  },
  "Hammer Curls": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hammer_Curls/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hammer_Curls/1.jpg",
  },
  "Reverse Wrist Curls": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Palms-Down_Wrist_Curl_Over_A_Bench/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Palms-Down_Wrist_Curl_Over_A_Bench/1.jpg",
  },
  "Dead Bugs": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dead_Bug/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dead_Bug/1.jpg",
  },
  "Side Plank": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Plank/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Plank/1.jpg",
  },
  "Backpack Shrugs": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shrug/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shrug/1.jpg",
  },
  "Floor Pullovers or Towel Straight-Arm Pulls": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Pullover/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Pullover/1.jpg",
  },
  "Close-Grip Push-Ups or Backpack Skull Crushers": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/1.jpg",
  },
  "Backpack Hammer Curls": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hammer_Curls/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hammer_Curls/1.jpg",
  },
  "Backpack Reverse Wrist Curls": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Palms-Down_Wrist_Curl_Over_A_Bench/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Palms-Down_Wrist_Curl_Over_A_Bench/1.jpg",
  },
  // Travel — no-equipment substitutions
  "Push-Ups / Incline Push-Ups": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Push-Up/1.jpg",
  },
  "Towel Door Rows or Table Inverted Rows": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Inverted_Row/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Inverted_Row/1.jpg",
  },
  "Pike Push-Ups": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Push-Up/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Push-Up/1.jpg",
  },
  "Doorframe Towel Rows or Sliding Floor Lat Pulls": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bodyweight_Mid_Row/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bodyweight_Mid_Row/1.jpg",
  },
  "Bench Dips or Bodyweight Triceps Extensions": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bench_Dips/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bench_Dips/1.jpg",
  },
  "Bodyweight Squats or Tempo Squats": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bodyweight_Squat/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bodyweight_Squat/1.jpg",
  },
  "Bodyweight Single-Leg RDLs": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/1.jpg",
  },
  "Bodyweight Walking or Reverse Lunges": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bodyweight_Walking_Lunge/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bodyweight_Walking_Lunge/1.jpg",
  },
  "Lying Hamstring Floor Slides": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Leg_Curls/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Leg_Curls/1.jpg",
  },
  "Single-Leg Bodyweight Calf Raises": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Calf_Raises/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Calf_Raises/1.jpg",
  },
  "Side Plank or Towel ISO Press": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Plank/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Plank/1.jpg",
  },
  "Wall Lateral ISO Raises or Backpack Raises": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Lateral_Raise/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Lateral_Raise/1.jpg",
  },
  "Doorframe Rear Delt Flyes / Prone Y-T-W Raises": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Rear_Delt_Raise/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Rear_Delt_Raise/1.jpg",
  },
  "Doorframe ISO Curls or Loaded Backpack Curls": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bicep_Curl/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bicep_Curl/1.jpg",
  },
  "Floor Leg Raises or Bodyweight Wall Rollouts": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Flat_Bench_Lying_Leg_Raise/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Flat_Bench_Lying_Leg_Raise/1.jpg",
  },
  "Single-Leg Good Mornings or Heavy Object Deadlifts": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Good_Morning/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Good_Morning/1.jpg",
  },
  "Bodyweight Bulgarian Split Squats": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Split_Squat_with_Dumbbells/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Split_Squat_with_Dumbbells/1.jpg",
  },
  "Single-Leg Glute Bridges": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hip_Thrust/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Butt_Lift_Bridge/1.jpg",
  },
  "Bodyweight Step-Ups or Sissy Squats": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Step_Ups/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Step_Ups/1.jpg",
  },
  "Loaded Water Jug / Backpack Carries": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Farmers_Walk/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Farmers_Walk/1.jpg",
  },
  // Older hotel-week aliases (history / incomplete sessions)
  "Dumbbell Bench Press": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bench_Press/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bench_Press/1.jpg",
  },
  "Standing Single-Arm DB Rows": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One-Arm_Dumbbell_Row/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One-Arm_Dumbbell_Row/1.jpg",
  },
  "Standing DB Shoulder Press": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shoulder_Press/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shoulder_Press/1.jpg",
  },
  "DB Goblet Squats": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Goblet_Squat/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Goblet_Squat/1.jpg",
  },
  "DB Romanian Deadlifts": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/1.jpg",
  },
  "DB Reverse Lunges": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Lunges/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Lunges/1.jpg",
  },
  "Bodyweight Calf Raises": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Calf_Raises/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Calf_Raises/1.jpg",
  },
  "DB Incline Press": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Press/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Press/1.jpg",
  },
  "DB Chest-Supported or Bent-Over Rows": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/1.jpg",
  },
  "DB Lateral Raises": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Lateral_Raise/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Lateral_Raise/1.jpg",
  },
  "DB Biceps Curls": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bicep_Curl/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bicep_Curl/1.jpg",
  },
  "DB Triceps Extensions": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Triceps_Press/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Triceps_Press/1.jpg",
  },
  "Push-Ups": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/1.jpg",
  },
  "DB Bulgarian Split Squats": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Split_Squat_with_Dumbbells/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Split_Squat_with_Dumbbells/1.jpg",
  },
  "Glute Bridges with DB on Hips": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hip_Thrust/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hip_Thrust/1.jpg",
  },
  "DB Single-Leg RDLs": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Kettlebell_One-Legged_Deadlift/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Kettlebell_One-Legged_Deadlift/1.jpg",
  },
  "DB Farmer's Carry": {
    start: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Farmers_Walk/0.jpg",
    end: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Farmers_Walk/1.jpg",
  },
};

export function getExerciseImages(name: string): { start: string; end: string } | null {
  if (IMAGE_MAP[name]) return IMAGE_MAP[name];
  const key = Object.keys(IMAGE_MAP).find(
    (entry) =>
      name.toLowerCase() === entry.toLowerCase() ||
      name.toLowerCase().includes(entry.toLowerCase()) ||
      entry.toLowerCase().includes(name.toLowerCase())
  );
  return key ? IMAGE_MAP[key] : null;
}
