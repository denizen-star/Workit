import type { Exercise } from '@/lib/workoutData';

export type TravelSubstitution = {
  name: string;
  notes: string;
  videoId?: string;
};

const BY_GYM_NAME: Record<string, TravelSubstitution> = {
  'Barbell or Dumbbell Bench Press': {
    name: 'Push-Ups / Incline Push-Ups',
    notes:
      'Elevate feet on a chair for upper chest (incline press alternative); elevate hands on a desk for an easier variation.',
    videoId: 'VXo1UwiAInM',
  },
  'Incline Dumbbell Bench Press': {
    name: 'Push-Ups / Incline Push-Ups',
    notes:
      'Elevate feet on a chair for upper chest (incline press alternative); elevate hands on a desk for an easier variation.',
    videoId: 'VXo1UwiAInM',
  },
  'Single-Arm Dumbbell Rows': {
    name: 'Towel Door Rows or Table Inverted Rows',
    notes:
      'Wrap a towel around a sturdy door handle to row your body back, or lie under a heavy table and pull your chest to the edge.',
    videoId: 'k4F3ze51pt8',
  },
  'Barbell or Chest-Supported Rows': {
    name: 'Towel Door Rows or Table Inverted Rows',
    notes:
      'Wrap a towel around a sturdy door handle to row your body back, or lie under a heavy table and pull your chest to the edge.',
    videoId: 'k4F3ze51pt8',
  },
  'Overhead Dumbbell Shoulder Press': {
    name: 'Pike Push-Ups',
    notes:
      'Elevate your hips into a downward-dog position so you are pushing vertically against your own bodyweight.',
    videoId: '0cT6ug3WVn4',
  },
  'Lat Pulldowns or Cable Rows': {
    name: 'Doorframe Towel Rows or Sliding Floor Lat Pulls',
    notes:
      'Lie face down on a smooth floor and use a towel to slide your body forward, pulling with your back muscles.',
    videoId: 'tnlKzMc1CRU',
  },
  'Triceps Cable Pushdowns or Overhead Extensions': {
    name: 'Bench Dips or Bodyweight Triceps Extensions',
    notes:
      'Do dips off a chair or couch, or do push-ups with hands placed close together (diamond push-ups).',
    videoId: 'iH16WFso6fo',
  },
  'Plank Hold': {
    name: 'Plank Hold',
    notes: 'No equipment needed. Keep your core tight and hips level.',
  },
  'Barbell Back Squats or Goblet Squats': {
    name: 'Bodyweight Squats or Tempo Squats',
    notes: 'Slow down to a 4-second descent to increase difficulty without added weight.',
  },
  'Romanian Deadlifts (RDLs)': {
    name: 'Bodyweight Single-Leg RDLs',
    notes:
      'Hinge at the hips on one leg, extending the opposite leg straight back to target hamstrings and balance.',
    videoId: 'qVhui08Jcy4',
  },
  'Walking Lunges': {
    name: 'Bodyweight Walking or Reverse Lunges',
    notes: 'Step back or forward, driving up through the front heel.',
  },
  'Leg Curl Machine or Swiss Ball Hamstring Curls': {
    name: 'Lying Hamstring Floor Slides',
    notes:
      'Lie on your back, place heels on socks or towels on a smooth floor, and drag your heels toward your glutes.',
    videoId: 'AlTI3igOaLw',
  },
  'Standing Calf Raises': {
    name: 'Single-Leg Bodyweight Calf Raises',
    notes: 'Stand on an edge (like a stair step) on one foot to get a full stretch and flex at the top.',
  },
  'Pallof Press': {
    name: 'Side Plank or Towel ISO Press',
    notes:
      'Hold a rigid side plank, or press firmly against a stationary doorframe to create isometric core tension.',
  },
  'Dumbbell Lateral Raises': {
    name: 'Wall Lateral ISO Raises or Backpack Raises',
    notes:
      'Press the backs of your hands outward against a doorframe or wall, or fill a backpack with books to perform raises.',
  },
  'Face Pulls': {
    name: 'Doorframe Rear Delt Flyes / Prone Y-T-W Raises',
    notes:
      "Lie face down on the floor and lift your arms in Y, T, and W shapes using purely back and shoulder strength.",
    videoId: '5TBjG5xuPa4',
  },
  'Dumbbell Biceps Curls': {
    name: 'Doorframe ISO Curls or Loaded Backpack Curls',
    notes: 'Grab a heavy backpack by the top handle and perform curls.',
  },
  'Hanging Knee Raises or Ab Wheel Rollouts': {
    name: 'Floor Leg Raises or Bodyweight Wall Rollouts',
    notes:
      'Lie flat on your back for leg raises, or use socks on a smooth floor in a plank position to slide hands out and back.',
  },
  'Trap Bar Deadlifts or Barbell Conventional Deadlifts': {
    name: 'Single-Leg Good Mornings or Heavy Object Deadlifts',
    notes:
      'Hinge at the hips with hands behind your head on one leg, or pick up a heavy water jug or duffel bag.',
  },
  'Bulgarian Split Squats': {
    name: 'Bodyweight Bulgarian Split Squats',
    notes: 'Rest your back foot on a chair, couch, or bed frame and perform single-leg lunges.',
  },
  'Barbell Hip Thrusts or Glute Bridges': {
    name: 'Single-Leg Glute Bridges',
    notes:
      'Lie flat, bend knees, elevate one leg, and drive through the grounded heel to work the glutes.',
    videoId: 'X_IGw8U_e38',
  },
  'Leg Extension Machine or Goblet Step-Ups': {
    name: 'Bodyweight Step-Ups or Sissy Squats',
    notes: 'Step onto a sturdy chair or stair step, or lean back into bodyweight leg extensions.',
  },
  "Farmer's Carries": {
    name: 'Loaded Water Jug / Backpack Carries',
    notes:
      'Carry two heavy water jugs, gallon containers, or a fully packed backpack by your sides for distance or time.',
    videoId: 'NH7Xv-7NQNQ',
  },
};

export function getTravelSubstitution(gymName: string): TravelSubstitution | null {
  return BY_GYM_NAME[gymName] ?? null;
}

export function toTravelExercise(exercise: Exercise): Exercise {
  const sub = getTravelSubstitution(exercise.name);
  if (!sub) return exercise;
  return {
    ...exercise,
    name: sub.name,
    notes: sub.notes,
    videoUrl: sub.videoId ? `https://www.youtube.com/watch?v=${sub.videoId}` : exercise.videoUrl,
  };
}
