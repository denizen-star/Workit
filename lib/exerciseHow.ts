/** Trainer-plain How cues. Keyed by gym name and travel name. */

const HOW: Record<string, string> = {
  'Barbell or Dumbbell Bench Press':
    'Lie on the bench, feet planted. Lower the bar or dumbbells to mid-chest. Press up without bouncing.',
  'Incline Dumbbell Bench Press':
    'Set the bench on a slight incline. Lower the dumbbells to the upper chest. Press up in a straight line.',
  'Single-Arm Dumbbell Rows':
    'Hinge, one hand on a bench. Pull the dumbbell to the hip. Keep the shoulder down. Do not twist.',
  'Barbell or Chest-Supported Rows':
    'Hinge or lie chest on an incline. Pull the bar or dumbbells to the ribs. Squeeze the shoulder blades. Lower under control.',
  'Overhead Dumbbell Shoulder Press':
    'Stand or sit tall. Press the dumbbells from the shoulders to lockout. Do not lean back. Lower to the ears.',
  'Lat Pulldowns or Cable Rows':
    'Pulldown: pull the bar to the upper chest, elbows down. Cable row: pull to the ribs, chest up. Do not shrug.',
  'Triceps Cable Pushdowns or Overhead Extensions':
    'Pushdown: pin the elbows, press the handle down. Overhead: lower behind the head, then extend. Only the forearms move.',
  'Plank Hold':
    'Elbows under shoulders. Body in one line. Ribs down, glutes on. Do not let the hips sag or pike.',
  'Barbell Back Squats or Goblet Squats':
    'Bar on the upper back, or a dumbbell at the chest. Sit the hips down and back. Knees track the toes. Stand up tall.',
  'Romanian Deadlifts (RDLs)':
    'Soft knees. Hinge at the hips, bar close to the legs. Feel the hamstrings. Stand by driving the hips forward.',
  'Walking Lunges':
    'Step forward or back. Front knee over mid-foot. Back knee drops under the hip. Drive up through the front heel.',
  'Leg Curl Machine or Swiss Ball Hamstring Curls':
    'Machine: curl the pad toward the glutes, then lower slow. Ball: heels on the ball, hips up, pull the ball in.',
  'Standing Calf Raises':
    'Ball of the foot on a step or floor. Drop the heel for a stretch. Rise onto the toes. Pause at the top.',
  'Pallof Press':
    'Stand side-on to the cable or band. Press the handle straight out. Do not let the torso rotate. Bring it back.',
  'Dumbbell Lateral Raises':
    'Soft elbows. Raise the dumbbells out to the sides to shoulder height. Lead with the elbows. Lower slow.',
  'Face Pulls':
    'Pull the rope or band to the face. Elbows high and wide. Squeeze the rear shoulders. Do not shrug.',
  'Dumbbell Biceps Curls':
    'Elbows by the ribs. Curl the dumbbells up. Lower all the way. Do not swing the torso.',
  'Hanging Knee Raises or Ab Wheel Rollouts':
    'Hanging: lift the knees toward the chest without swinging. Wheel: roll out, keep the ribs down, pull back.',
  'Trap Bar Deadlifts or Barbell Conventional Deadlifts':
    'Hinge, grab the handles or bar. Chest up, lats on. Push the floor away. Stand tall. Lower with the same hinge.',
  'Bulgarian Split Squats':
    'Back foot on a bench. Front foot far enough to stay heel-down. Drop the back knee. Drive up through the front leg.',
  'Barbell Hip Thrusts or Glute Bridges':
    'Upper back on a bench, or shoulders on the floor. Drive through the heels. Squeeze the glutes at the top. Do not arch the ribs.',
  'Leg Extension Machine or Goblet Step-Ups':
    'Extension: extend the knees, pause, lower slow. Step-up: whole foot on the box, drive up, control the down.',
  "Farmer's Carries":
    'Stand tall with a weight in each hand. Walk even steps. Shoulders packed. Do not lean or shrug.',
  'Dumbbell or Barbell Shrugs':
    'Hold the weight at the sides. Shrug the shoulders straight up. Pause. Lower without rolling.',
  'Straight-Arm Pulldowns or Dumbbell Pullovers':
    'Pulldown: arms long, pull the bar to the thighs with the lats. Pullover: lower the weight behind the head, then pull to the chest.',
  'Lying Triceps Extensions (Skull Crushers)':
    'Lie on a bench. Elbows point up. Lower the weight toward the forehead or behind the head. Extend to lockout.',
  'Hammer Curls':
    'Thumbs-up grip. Curl the dumbbells without turning the wrists. Elbows stay close. Lower under control.',
  'Reverse Wrist Curls':
    'Forearms on the thighs, palms down. Curl the wrists up. Lower slow. Use a light load.',
  'Dead Bugs':
    'On the back, ribs down. Opposite arm and leg reach long. Do not let the low back lift. Return and switch.',
  'Side Plank':
    'On one forearm. Stack or stagger the feet. Lift the hips. Head to heels in one line. Do not roll forward.',

  'Push-Ups / Incline Push-Ups':
    'Hands under the shoulders. Body in one line. Lower the chest toward the floor or a surface. Press up. Hands on a desk makes it easier. Feet on a chair makes it harder.',
  'Towel Door Rows or Table Inverted Rows':
    'Anchor a towel on a closed door and lean back, or lie under a sturdy table. Pull the chest to the hands. Squeeze the back. Lower slow.',
  'Pike Push-Ups':
    'Hips high, like a downward dog. Bend the elbows and lower the head toward the floor. Press back up. Keep the hips stacked.',
  'Doorframe Towel Rows or Sliding Floor Lat Pulls':
    'Row from a door towel, or lie face down and slide the body forward on a towel using the lats. Keep the arms long on the floor version.',
  'Bench Dips or Bodyweight Triceps Extensions':
    'Dips: hands on a chair, lower until the upper arms are parallel, then press up. Close-grip push-ups: hands close, elbows by the ribs.',
  'Bodyweight Squats or Tempo Squats':
    'Feet about shoulder width. Sit the hips down and back. Knees track the toes. Take four seconds on the way down if you need more work.',
  'Bodyweight Single-Leg RDLs':
    'Hinge at the hips on one leg. The other leg reaches straight back. Keep the hips square. Stand up tall.',
  'Bodyweight Walking or Reverse Lunges':
    'Step forward or back. Front knee over mid-foot. Drive up through the front heel.',
  'Lying Hamstring Floor Slides':
    'Lie on the back, heels on socks or towels. Hips up. Drag the heels toward the glutes. Slide them back out.',
  'Hamstring Walkouts':
    'Lie on the back. Lift the hips into a bridge. Walk the heels out a few inches at a time, then walk them back in. Keep the hips up. No sliders.',
  'Single-Leg Bodyweight Calf Raises':
    'Stand on one foot on a step if you can. Drop the heel, then rise onto the toes. Pause at the top.',
  'Side Plank or Towel ISO Press':
    'Hold a side plank, hips high. Or stand in a doorframe and press the hands out hard without moving.',
  'Wall Lateral ISO Raises or Backpack Raises':
    'Press the backs of the hands into a doorframe at shoulder height, or raise a loaded backpack out to the side.',
  'Doorframe Rear Delt Flyes / Prone Y-T-W Raises':
    'Lie face down. Lift the arms into Y, then T, then W. Squeeze the upper back. Do not crank the neck.',
  'Doorframe ISO Curls or Loaded Backpack Curls':
    'Curl a packed backpack by the top handle, or press the fists up into a doorframe and hold.',
  'Floor Leg Raises or Bodyweight Wall Rollouts':
    'Lie on the back and lift the legs without swinging. Or plank on socks and slide the hands out, then pull them back.',
  'Single-Leg Good Mornings or Heavy Object Deadlifts':
    'Hinge on one leg, hands behind the head. Or pick up a heavy bag or jug with a flat back and stand tall.',
  'Bodyweight Bulgarian Split Squats':
    'Back foot on a chair or bed. Front heel down. Drop the back knee. Drive up through the front leg.',
  'Single-Leg Glute Bridges':
    'Lie on the back, one knee bent. Other leg up. Drive through the grounded heel. Squeeze the glute at the top.',
  'Bodyweight Step-Ups or Sissy Squats':
    'Step onto a sturdy chair or stair, whole foot down. Or lean back slightly and bend the knees to load the quads.',
  'Loaded Water Jug / Backpack Carries':
    'Carry jugs or a packed backpack at the sides. Walk even. Stand tall. Do not lean.',
  'Backpack Shrugs':
    'Hold or wear a packed backpack. Shrug the shoulders straight up. Pause. Lower.',
  'Floor Pullovers or Towel Straight-Arm Pulls':
    'Lie on the back and pull a backpack from overhead to the hips. Or slide a towel on the floor in a straight-arm pulldown.',
  'Close-Grip Push-Ups or Backpack Skull Crushers':
    'Hands close for push-ups, elbows by the ribs. Or lie on the back, lower a backpack behind the head, then extend.',
  'Backpack Hammer Curls':
    'Hold a backpack by the side handle, thumbs up. Curl without swinging. Lower slow.',
  'Backpack Reverse Wrist Curls':
    'Sit, forearms on the thighs, palms down. Curl a light backpack up with the wrists. Lower slow.',
};

export function howForExercise(name: string): string | null {
  const how = HOW[name];
  return how || null;
}
