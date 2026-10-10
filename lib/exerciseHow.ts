/** Trainer-plain How cues. Keyed by gym name and travel name. */

const HOW: Record<string, string> = {
  'Barbell or Dumbbell Bench Press':
    'Lie on the bench, feet planted. Lower the bar or dumbbells to mid-chest. Press up without bouncing.',
  'Incline Dumbbell Bench Press':
    'Set the bench on a slight incline. Lower the dumbbells to the upper chest. Press up in a straight line.',
  'Decline Dumbbell Bench Press':
    'Set the bench on a slight decline, feet hooked. Lower the dumbbells to the lower chest. Press up and slightly back over the chest.',
  'Chest Dips':
    'Hands on parallel bars. Lean the chest forward, elbows slightly out. Lower until the shoulders dip just below the elbows. Press up.',
  'High-to-Low Cable Fly':
    'Pulleys high, one handle in each hand, step forward. Soft elbows. Sweep the hands down and together in front of the hips. Open slow.',
  'Incline Push-Ups':
    'Hands on a bench, desk or counter. Body in one line. Lower the chest to the edge. Press up. Higher hands makes it easier.',
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
  'Cable Chest Fly':
    'Pulleys at chest height, one handle in each hand, step forward. Soft bend in the elbows. Sweep the hands together in front of the chest. Open slow until you feel the chest stretch.',
  'Backpack Floor Flyes':
    'Lie on the floor, knees bent. Hold a loaded backpack strap or a water jug in each hand above the chest, palms facing. Soft elbows. Open the arms wide until the upper arms touch the floor. Squeeze back up.',
  'Dumbbell Flyes':
    'Lie on a flat bench, dumbbells above the chest, palms facing. Soft bend in the elbows. Open wide until you feel the chest stretch. Hug them back up. Do not press.',
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
  'Leg Press':
    'Back flat on the pad, feet shoulder width mid-platform. Lower until the knees reach about 90 degrees. Press through the whole foot. Do not lock the knees.',
  'Leg Extension Machine':
    'Pad on the front of the ankles, knees in line with the pivot. Extend the knees, pause at the top, lower slow.',
  'Goblet Step-Ups':
    'Hold a dumbbell at the chest. Whole foot on the box. Drive up through that heel. Control the step down.',
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
  'Hanging Knee Raises':
    'Hang from the bar. Pack your shoulder blades down and back, proud chest, before you lift. Lift the knees toward the chest without swinging. Lower slow.',
  'Hanging Leg Raises':
    'Hang from the bar, shoulders packed. Legs straight, lift them to hip height or higher. No swing. Lower slow.',
  'Ab Wheel Rollouts':
    'Knees on a mat, hands on the wheel. Roll out as far as the low back stays flat. Ribs down. Pull back with the abs.',
  'Reverse Crunches':
    'On the back, knees bent up. Curl the hips off the floor toward the ribs. Lower slow. No swinging the legs.',
  Crunches:
    'On the back, knees bent, hands by the ears. Curl the shoulders off the floor. Pause. Lower slow. Do not pull the neck.',
  'Bicycle Crunches':
    'On the back, hands by the ears. Elbow to the opposite knee while the other leg reaches long. Slow and controlled.',
  'Russian Twists':
    'Sit, lean back a little, chest tall. Rotate the shoulders side to side. Feet down or up. Spine stays long.',
  'Goblet Squats':
    'Hold one dumbbell upright at the chest. Feet a little wider than the hips. Sit deep between the knees, chest tall, knees over the toes. Drive back up.',
  'Reverse Lunges':
    'Dumbbells at the sides. Step back and lower the back knee toward the floor. Front heel stays down. Push through the front foot to stand.',
  'Dumbbell Floor Press':
    'Lie on the floor, knees bent. Dumbbells over the chest. Lower until the upper arms touch the floor, elbows about 45° from the body. Press straight up.',
  'Dumbbell Sumo Deadlifts':
    'Wide stance, toes turned out about 45°. Dumbbells hang between the legs. Hinge at the hips, back flat, then stand and squeeze the glutes at the top.',
  'Renegade Row to Push-Ups':
    'Plank on two dumbbells, feet wide. Do a push-up, then row one dumbbell to the hip without letting the hips twist. Alternate sides each rep.',
  'Dumbbell Arnold Press':
    'Dumbbells at the chest, palms facing you. Press overhead while turning the palms forward. Reverse the turn on the way down. Ribs stay down.',
  'Dumbbell Floor Flyes':
    'Lie on the floor, knees bent, dumbbells above the chest with a soft bend in the elbows. Open the arms wide until the upper arms touch the floor. Squeeze back up.',
  'Dumbbell Single-Leg Deadlifts with Row':
    'Hinge on one leg, the other leg reaching back. Hold the bottom, row both dumbbells to the ribs, lower them, then stand. Hips stay level.',
  'Dumbbell Woodchoppers':
    'Hold one dumbbell in both hands low by one knee. Pivot the feet and sweep it up across the body above the opposite shoulder. Control it back down.',
  'Cable Woodchops':
    'Cable high and to one side. Arms long. Pull it down and across the body, pivoting the back foot. Control it back up.',
  'Lying Leg Raises':
    'On the back, hands by the hips. Legs straight, lift them to vertical. Lower slow without the low back lifting.',
  'Inchworm Walkouts':
    'Stand, fold, hands to the floor. Walk the hands out to a plank. Hold a beat. Walk them back and stand.',
  'Backpack Woodchops':
    'Hold a packed backpack high to one side. Chop it down and across to the opposite hip, pivoting the back foot. Control it back up.',

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
