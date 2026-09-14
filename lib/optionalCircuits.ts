import {
  type OptionalCircuitStep,
  type OptionalLevel,
  type OptionalRegion,
  type OptionalSlot,
  type OptionalTrack,
} from '@/lib/optionals';

/** Mirrors lib/optionals.ts YOGA_HOLD_SECONDS/ABS_WORK_SECONDS. Kept local to avoid a value-level import cycle with lib/optionals.ts (which imports the circuit builders below). */
const YOGA_HOLD_SECONDS = 120;
const ABS_WORK_SECONDS = 45;

const FED = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

type Cue = {
  title: string;
  warmup: string;
  cooldown: string;
  id: string;
  videoId: string;
};

function stills(id: string) {
  return {
    start: `${FED}/${id}/0.jpg`,
    end: `${FED}/${id}/1.jpg`,
  };
}

function holdSeconds(level: OptionalLevel, index: number, total: number) {
  if (level === 'easy') return 45;
  if (level === 'medium') return 60;
  return index === total - 1 ? 90 : 75;
}

function render(slot: OptionalSlot, level: OptionalLevel, cues: Cue[]): OptionalCircuitStep[] {
  return cues.map((cue, index) => ({
    title: cue.title,
    body: slot === 'warmup' ? cue.warmup : cue.cooldown,
    holdSeconds: holdSeconds(level, index, cues.length),
    videoId: cue.videoId,
    ...stills(cue.id),
  }));
}

function isUpperB(dayName: string) {
  return /upper body b/i.test(dayName);
}

function isLowerB(dayName: string) {
  return /lower body b/i.test(dayName);
}

function cue(
  title: string,
  warmup: string,
  cooldown: string,
  id: string,
  videoId: string
): Cue {
  return { title, warmup, cooldown, id, videoId };
}

const HOLD = {
  neck: cue(
    'Neck',
    'Slow look left and right. Switch sides halfway. No forcing.',
    'Softer turns. Let the neck empty.',
    'Side_Neck_Stretch',
    'was4RtzpfJs'
  ),
  shoulders: cue(
    'Shoulders',
    'Roll them back. Open the chest a little.',
    'Slow rolls. Drop what the press left behind.',
    'Shoulder_Circles',
    'X3-gKPNyrTA'
  ),
  chest: cue(
    'Chest',
    'Hands on a wall or behind you. Open without a fight.',
    'Same wall. Stay. Breathe into the stretch.',
    'Chest_And_Front_Of_Shoulder_Stretch',
    'NS64IgKUyeY'
  ),
  lats: cue(
    'Lats',
    "Child's pose or a wall reach. Walk the hands away. Soft elbows.",
    'Longer reach. Let the lats melt after the rows.',
    'One_Arm_Against_Wall',
    'eqVMAPM00DM'
  ),
  thoracic: cue(
    'Thoracic',
    'Cat-cow or an easy open-book on your side. Move with the breath.',
    'Slower cat-cow. Nothing left to prove in the spine.',
    'Spinal_Stretch',
    'y39PrKY_4JM'
  ),
  wrists: cue(
    'Wrists',
    'Palms on a wall, fingers down, or an easy overhead triceps fold.',
    'Wrist fold, then shake the hands out.',
    'Wrist_Circles',
    'D4-jQu5GfBg'
  ),
  catCow: cue(
    'Cat-cow',
    'On all fours. Round and arch with the breath.',
    'Slower rounds. Let the upper back go.',
    'Cat_Stretch',
    'y39PrKY_4JM'
  ),
  thread: cue(
    'Thread-the-needle',
    'Slide one arm under the chest. Both sides.',
    'Stay in the twist a little longer. Switch.',
    'Middle_Back_Stretch',
    'VpW33Celubg'
  ),
  puppy: cue(
    'Puppy pose',
    'Hips over knees. Walk the hands forward. Chest toward the floor.',
    'Same shape. Softer elbows. Long exhales.',
    'Childs_Pose',
    'eqVMAPM00DM'
  ),
  eagle: cue(
    'Eagle arms',
    'Wrap the arms. Lift the elbows. Both sides if one wrap is enough.',
    'Cow-face or eagle. Unwind slow.',
    'Round_The_World_Shoulder_Stretch',
    'X3-gKPNyrTA'
  ),
  mermaid: cue(
    'Mermaid',
    'Sit. One hand down. Other arm overhead. Side body. Switch halfway.',
    'Same side bend. Less reach, more breath.',
    'Standing_Lateral_Stretch',
    'H9xuMZaiNJY'
  ),
  supineTwist: cue(
    'Supine twist',
    'On your back, knees together, let them fall to one side. Switch halfway.',
    'Knees heavy. Look the other way. Then rest.',
    'Knee_Across_The_Body',
    'i-y8pp5EfYw'
  ),
  downDogPuppy: cue(
    'Down dog to puppy',
    'Down dog first. Then walk the hands and drop the chest. Stay.',
    'Skip the push. Puppy only. Long stay.',
    'Pyramid',
    'zqwK6J3yHfA'
  ),
  longPuppy: cue(
    'Long puppy',
    'Chest lower. Shoulders load. Ribs quiet.',
    'Foreheads toward the floor. Soft neck.',
    'Upper_Back-Leg_Grab',
    'eqVMAPM00DM'
  ),
  cowFace: cue(
    'Cow-face arms',
    'One elbow up, one down. Both sides. Longer than Medium.',
    'Same bind. Less pull.',
    'Overhead_Triceps',
    '80Y3HHMgo6w'
  ),
  calves: cue(
    'Calves',
    'Heel down, knee soft. Switch sides halfway.',
    'Heel down. Let the legs empty.',
    'Standing_Gastrocnemius_Calf_Stretch',
    'i1eJqJ3v3lQ'
  ),
  hipFlexors: cue(
    'Hip flexors',
    'Half-kneeling lunge. Back glute squeezed. Not a backbend.',
    'Same kneel. Softer. You already did the work.',
    'Kneeling_Hip_Flexor',
    'YQmpO9VT2X4'
  ),
  adductors: cue(
    'Adductors',
    'Easy side lunge. Sit between the knees as far as is kind.',
    'Wide knees. No bounce.',
    'Adductor',
    'YQmpO9VT2X4'
  ),
  quads: cue(
    'Quads',
    'Stand or lie on your side. Heel toward the glute. Switch halfway.',
    'Same fold. Slower.',
    'On_Your_Side_Quad_Stretch',
    'CAq9vV7gkrs'
  ),
  figureFour: cue(
    'Figure-four',
    'Ankle on the other knee. Sit tall, then fold a little.',
    'Reclined figure-four. Heavy hips.',
    'Ankle_On_The_Knee',
    '-g0nuyTHMrI'
  ),
  hamstrings: cue(
    'Hamstrings',
    'Easy fold or a long sit. Soft knees. No yanking.',
    'Longer fold. Soft knees still.',
    'Seated_Floor_Hamstring_Stretch',
    'wr_8aak4Wbc'
  ),
  downDog: cue(
    'Down dog',
    'Pedal the heels. Soft knees if the hamstrings talk.',
    'Down dog, then drop to the knees when you need.',
    'Inchworm',
    'zqwK6J3yHfA'
  ),
  lowLunge: cue(
    'Low lunge',
    'Back knee down. Both sides. Hips square.',
    'Same lunge. Less depth, more breath.',
    'Intermediate_Hip_Flexor_and_Quad_Stretch',
    'YQmpO9VT2X4'
  ),
  lizard: cue(
    'Lizard',
    'Hands inside the front foot. Elbows toward the floor if it is kind.',
    'Lizard, stay. Switch halfway.',
    'Worlds_Greatest_Stretch',
    'YQmpO9VT2X4'
  ),
  halfSplit: cue(
    'Half split',
    'Front heel. Hips back. Fold over the leg.',
    'Same fold. Softer knee.',
    'Runners_Stretch',
    'wr_8aak4Wbc'
  ),
  reclinedPigeon: cue(
    'Reclined pigeon',
    'Figure-four on your back. Draw the thigh in.',
    'Same shape. Let the hip sink.',
    'Lying_Glute',
    '0_zPqA65Nok'
  ),
  butterfly: cue(
    'Butterfly',
    'Soles together. Or happy baby if the hips prefer it.',
    'Butterfly or happy baby. Stay easy.',
    'Lying_Bent_Leg_Groin',
    'JJAHGpe0AVU'
  ),
  lowLungeReach: cue(
    'Low lunge reach',
    'Knee down. Arm up on the back-leg side. Tiny side bend. Switch.',
    'Lunge without the reach if the hip is done.',
    'Standing_Hip_Flexors',
    'YQmpO9VT2X4'
  ),
  pigeon: cue(
    'Pigeon',
    'Front shin across. Fold only if the hip allows.',
    'Pigeon or reclined figure-four. No forcing.',
    'IT_Band_and_Glute_Stretch',
    '0_zPqA65Nok'
  ),
  frogFold: cue(
    'Frog to fold',
    'Wide-knee child’s pose or frog, then a long hamstring fold.',
    'Wide knees, then a soft forward fold until the hold ends.',
    'The_Straddle',
    'wr_8aak4Wbc'
  ),
  deadBug: cue(
    'Dead bug',
    'Back stays on the floor. Slow opposite arm and leg.',
    'Slower than the warmup. Floor is a friend.',
    'Dead_Bug',
    '4XLEnwUr1d8'
  ),
  birdDog: cue(
    'Bird dog',
    'Opposite arm and leg. Pause. Not a long front plank.',
    'Smaller reach. Quiet hips.',
    'Superman',
    'ZdAHe9_HeEw'
  ),
  heelTaps: cue(
    'Heel taps',
    'Knees bent. Tap one heel then the other. Soft.',
    'Same taps. Smaller.',
    'Alternate_Heel_Touchers',
    '9bR-elyolBQ'
  ),
  sideLyingHold: cue(
    'Side-lying hold',
    'On your side. Knees down. Hips stacked. Switch halfway.',
    'Short side hold. Then roll onto your back.',
    'Side_Bridge',
    'rCxF2nG9vQ0'
  ),
  easyHollow: cue(
    'Easy hollow',
    'Knees bent. Low back glued down. Shoulders heavy.',
    'Even smaller. Stop while it is kind.',
    'Stomach_Vacuum',
    'RUNrHkbP4Pc'
  ),
  breatheDown: cue(
    'Breathe down',
    'On your back, hands on ribs. Long easy breaths.',
    "Child's pose or on your back. Long easy breaths.",
    'Hug_Knees_To_Chest',
    'zqwK6J3yHfA'
  ),
  pilatesBreath: cue(
    'Pilates breath',
    'Ribs in. Long exhale. Quiet belly.',
    'Same breath. You already worked.',
    'Standing_Pelvic_Tilt',
    'zqwK6J3yHfA'
  ),
  singleLegStretch: cue(
    'Single-leg stretch',
    'One knee in. One long. Switch. Head can stay down.',
    'Slower switches. Neck soft.',
    'One_Knee_To_Chest',
    '9bR-elyolBQ'
  ),
  crissCross: cue(
    'Criss-cross',
    'Small. Shoulders only as high as the neck stays kind.',
    'Tiny rotation. Or skip to a side breath if the neck talks.',
    'Cross-Body_Crunch',
    'RUNrHkbP4Pc'
  ),
  sideLyingKick: cue(
    'Side-lying kick',
    'Small front and back. Both sides.',
    'Even smaller kicks. Then rest on that side.',
    'Side_Leg_Raises',
    'rCxF2nG9vQ0'
  ),
  rest: cue(
    'Rest',
    'Knees into the chest, or hands on ribs.',
    'Knees in. Let the belly go.',
    'Hug_A_Ball',
    'zqwK6J3yHfA'
  ),
  hundred: cue(
    'The hundred',
    'Knees tabletop. Arms pump. Breath in fives.',
    'Half the pumps. Or hold tabletop and breathe.',
    'Crunches',
    'RUNrHkbP4Pc'
  ),
  doubleLeg: cue(
    'Double-leg stretch',
    'Reach long. Circle home. Back stays down.',
    'Shorter reach. Same back rule.',
    'Scissor_Kick',
    '4XLEnwUr1d8'
  ),
  sideKick: cue(
    'Side kick series',
    'Front, back, then a small lift. Both sides.',
    'Front and back only.',
    'Hip_Circles_prone',
    'rCxF2nG9vQ0'
  ),
  teaser: cue(
    'Teaser prep',
    'Legs tabletop. Roll the shoulders up. Hold. Not a full teaser unless it is clean.',
    'Shoulders stay down. Hands on ribs.',
    'Decline_Crunch',
    'RUNrHkbP4Pc'
  ),
  childs: cue(
    "Child's pose",
    'Hips to heels. Arms long. Stay.',
    'Forehead down. Long breaths until the hold ends.',
    'Childs_Pose',
    'zqwK6J3yHfA'
  ),
  gluteBridge: cue(
    'Glute bridge',
    'Easy squeeze at the top. No rush.',
    'Short squeeze. Then let the floor take you.',
    'Butt_Lift_Bridge',
    'X_IGw8U_e38'
  ),
  bear: cue(
    'Bear hold',
    'Hands and toes. Knees an inch off the floor. Quiet spine.',
    'Shorter bear, or a dead bug if the wrists are done.',
    'Plank',
    'ASdvN_XEl_c'
  ),
  easySidePlank: cue(
    'Easy side plank',
    'Knees down. Hips high. Switch halfway.',
    'Short side. Then roll down.',
    'Push_Up_to_Side_Plank',
    'rCxF2nG9vQ0'
  ),
  shoulderBridge: cue(
    'Shoulder bridge',
    'Squeeze, lower slow.',
    'Smaller lift. Slow lower.',
    'Pelvic_Tilt_Into_Bridge',
    'X_IGw8U_e38'
  ),
  marchingBridge: cue(
    'Marching bridge',
    'One foot lifts. Hips stay level.',
    'Tiny marches. Or a still bridge.',
    'Physioball_Hip_Bridge',
    'X_IGw8U_e38'
  ),
  toeTaps: cue(
    'Toe taps',
    'Tabletop. Tap one toe, then the other. Back stays down.',
    'Slower taps.',
    'Front_Leg_Raises',
    '4XLEnwUr1d8'
  ),
  saw: cue(
    'Saw',
    'Sit tall. Twist. Reach to the little toe. Soft knees.',
    'Smaller twist. Sit on a cushion if you need.',
    'Russian_Twist',
    'RUNrHkbP4Pc'
  ),
  clams: cue(
    'Clams',
    'Side-lying. Knees bent. Open the top knee. Both sides.',
    'Small clams, or a still side-lying rest.',
    'Side_Lying_Groin_Stretch',
    'X_IGw8U_e38'
  ),
  singleLegBridge: cue(
    'Single-leg bridge',
    'Both sides. Hips level.',
    'Shorter, or both feet down.',
    'Single_Leg_Glute_Bridge',
    'X_IGw8U_e38'
  ),
  rollUp: cue(
    'Roll-up',
    'Half roll-up if the back talks. Stack one bone at a time.',
    'Tiny curl. Neck soft.',
    'Lower_Back_Curl',
    'RUNrHkbP4Pc'
  ),
  boat: cue(
    'Boat',
    'Knees bent. Hold. Then 90/90 breathing on the back.',
    'Skip the boat. 90/90 on the back until the hold ends.',
    'Tuck_Crunch',
    'RUNrHkbP4Pc'
  ),
};

const STRETCH_UPPER: Record<OptionalLevel, Cue[]> = {
  easy: [HOLD.neck, HOLD.shoulders, HOLD.chest, HOLD.lats, HOLD.thoracic, HOLD.wrists],
  medium: [HOLD.catCow, HOLD.thread, HOLD.puppy, HOLD.eagle, HOLD.mermaid, HOLD.supineTwist],
  hard: [HOLD.downDogPuppy, HOLD.thread, HOLD.longPuppy, HOLD.cowFace, HOLD.mermaid, HOLD.supineTwist],
};

const STRETCH_LOWER: Record<OptionalLevel, Cue[]> = {
  easy: [HOLD.calves, HOLD.hipFlexors, HOLD.adductors, HOLD.quads, HOLD.figureFour, HOLD.hamstrings],
  medium: [HOLD.downDog, HOLD.lowLunge, HOLD.lizard, HOLD.halfSplit, HOLD.reclinedPigeon, HOLD.butterfly],
  hard: [HOLD.downDog, HOLD.lowLungeReach, HOLD.lizard, HOLD.halfSplit, HOLD.pigeon, HOLD.frogFold],
};

const CORE_UPPER_EASY: Cue[] = [
  HOLD.deadBug,
  HOLD.birdDog,
  HOLD.heelTaps,
  HOLD.sideLyingHold,
  HOLD.easyHollow,
  HOLD.breatheDown,
];

const CORE_UPPER_MEDIUM: Cue[] = [
  HOLD.pilatesBreath,
  HOLD.singleLegStretch,
  HOLD.birdDog,
  HOLD.crissCross,
  HOLD.sideLyingKick,
  HOLD.rest,
];

const CORE_UPPER_MEDIUM_B: Cue[] = [
  CORE_UPPER_MEDIUM[0],
  CORE_UPPER_MEDIUM[1],
  CORE_UPPER_MEDIUM[2],
  {
    ...HOLD.sideLyingKick,
    warmup: 'Skip the crunch series. Small front and back kicks. Both sides.',
    cooldown: 'Side kicks only. Neck stays down.',
  },
  CORE_UPPER_MEDIUM[4],
  CORE_UPPER_MEDIUM[5],
];

const CORE_UPPER_HARD: Cue[] = [
  HOLD.hundred,
  HOLD.doubleLeg,
  HOLD.crissCross,
  HOLD.sideKick,
  HOLD.teaser,
  HOLD.childs,
];

const CORE_UPPER_HARD_B: Cue[] = [
  CORE_UPPER_HARD[0],
  CORE_UPPER_HARD[1],
  {
    ...HOLD.birdDog,
    warmup: 'Pause three counts. No criss-cross on this pull day.',
    cooldown: 'Small bird dog. Then rest.',
  },
  CORE_UPPER_HARD[3],
  CORE_UPPER_HARD[4],
  CORE_UPPER_HARD[5],
];

const CORE_LOWER_EASY: Cue[] = [
  {
    ...HOLD.deadBug,
    cooldown: 'Slower. Brace like a hinge, then let it go.',
  },
  HOLD.gluteBridge,
  {
    ...HOLD.heelTaps,
    warmup: 'Knees bent, or a marching bridge if the hips want it.',
    cooldown: 'Soft taps. Hips heavy.',
  },
  HOLD.bear,
  HOLD.easySidePlank,
  {
    ...HOLD.catCow,
    warmup: 'Round and arch, then child’s pose if you have time.',
    cooldown: 'Cat-cow, then child’s pose. Long breaths.',
  },
];

const CORE_LOWER_MEDIUM: Cue[] = [
  HOLD.shoulderBridge,
  HOLD.marchingBridge,
  HOLD.toeTaps,
  HOLD.saw,
  HOLD.clams,
  {
    ...HOLD.childs,
    warmup: 'Hips to heels. Breathe into the back.',
    cooldown: 'Stay. You are cooling.',
  },
];

const DEAD_BUG_LONG: Cue = {
  ...HOLD.deadBug,
  warmup: 'Longer. Legs can stay bent. Back glued down. Hip thrust already owns the bridge.',
  cooldown: 'Slow dead bug. No bridge on this hinge day.',
};

const CORE_LOWER_HARD: Cue[] = [
  {
    ...HOLD.shoulderBridge,
    warmup: 'Two-count hold at the top.',
    cooldown: 'One squeeze, then down.',
  },
  HOLD.singleLegBridge,
  HOLD.rollUp,
  {
    ...HOLD.saw,
    warmup: 'Fuller twist. Soft knees still.',
    cooldown: 'Easy twist. Sit tall.',
  },
  HOLD.sideKick,
  HOLD.boat,
];

const CORE_LOWER_HARD_B: Cue[] = [
  DEAD_BUG_LONG,
  {
    ...HOLD.deadBug,
    warmup: 'Keep going. No single-leg bridge. Hip thrust is the day.',
    cooldown: 'Same dead bug. Soft.',
  },
  CORE_LOWER_HARD[2],
  CORE_LOWER_HARD[3],
  CORE_LOWER_HARD[4],
  CORE_LOWER_HARD[5],
];

function coreUpper(level: OptionalLevel, dayName: string): Cue[] {
  if (level === 'easy') return CORE_UPPER_EASY;
  if (level === 'medium') return isUpperB(dayName) ? CORE_UPPER_MEDIUM_B : CORE_UPPER_MEDIUM;
  return isUpperB(dayName) ? CORE_UPPER_HARD_B : CORE_UPPER_HARD;
}

function coreLower(level: OptionalLevel, dayName: string): Cue[] {
  if (level === 'easy') return CORE_LOWER_EASY;
  if (level === 'medium') return CORE_LOWER_MEDIUM;
  return isLowerB(dayName) ? CORE_LOWER_HARD_B : CORE_LOWER_HARD;
}

/** Six-hold stretch/core list for the day’s region and picked level. */
export function guidedOptionalCircuit(
  slot: OptionalSlot,
  track: Extract<OptionalTrack, 'stretch' | 'core'>,
  region: OptionalRegion,
  level: OptionalLevel,
  dayName = ''
): OptionalCircuitStep[] {
  if (track === 'stretch') {
    const pack = region === 'lower' ? STRETCH_LOWER : STRETCH_UPPER;
    return render(slot, level, pack[level]);
  }
  const cues = region === 'lower' ? coreLower(level, dayName) : coreUpper(level, dayName);
  return render(slot, level, cues);
}

/** One Yoga pose or Abs exercise. Unlike Cue above, body text does not vary by slot — warmup and cooldown are entirely separate sequences. */
type FixedStep = {
  title: string;
  body: string;
  /** free-exercise-db id for stills. Omitted when no matching entry exists. */
  id?: string;
  videoId?: string;
  /**
   * YouTube auto-generated frame index (0-3) to use as the "end" still when there's
   * no free-exercise-db id. Frame 0 is the high-res thumbnail (same as the video
   * button); 1-3 are lower-res but real, distinct moments from the video, hand-picked
   * per pose so every Yoga/Abs step gets a start/end pair, not just the ones with a
   * free-exercise-db match.
   */
  endFrame?: 0 | 1 | 2 | 3;
};

/** One of YouTube's auto-generated preview frames for a video (0 = high-res thumbnail, 1-3 lower-res). */
function youtubeFrame(videoId: string, frame: number) {
  return `https://img.youtube.com/vi/${videoId}/${frame}.jpg`;
}

function renderFixed(steps: FixedStep[], holdSeconds: number): OptionalCircuitStep[] {
  return steps.map((step) => {
    const media = step.id
      ? stills(step.id)
      : step.videoId
        ? { start: youtubeFrame(step.videoId, 0), end: youtubeFrame(step.videoId, step.endFrame ?? 0) }
        : {};
    return {
      title: step.title,
      body: step.body,
      holdSeconds,
      videoId: step.videoId,
      ...media,
    };
  });
}

const YOGA_WARMUP_UPPER: FixedStep[] = [
  {
    title: 'Cat-Cow',
    body: 'Move between arching and rounding your spine on tabletop position to warm up the spinal column.',
    id: 'Cat_Stretch',
    videoId: 'y39PrKY_4JM',
  },
  {
    title: 'Downward-Facing Dog',
    body: 'Pedal your feet out to stretch calves, hamstrings, and shoulders.',
    id: 'Inchworm',
    videoId: 'zqwK6J3yHfA',
  },
  {
    title: 'Sun Salutation A Flow',
    body: 'Move smoothly through mountain pose, forward fold, plank, and cobra to heat up the entire body.',
    videoId: 'NO2dfdqhsvo',
    endFrame: 2,
  },
  {
    title: 'Dynamic Low Lunge with Arm Reaches',
    body: 'Step one foot forward, press hips down, and reach upward to open the hip flexors and side body.',
    videoId: 'a_g_qUpsBII',
    endFrame: 1,
  },
  {
    title: 'Standing Forward Fold with Ragdoll Sway',
    body: 'Hold opposite elbows, bend knees slightly, and gently sway side-to-side to release lower back tension.',
    videoId: '2W7Dhf6n5aM',
    endFrame: 1,
  },
];

const YOGA_COOLDOWN_UPPER: FixedStep[] = [
  {
    title: "Child's Pose",
    body: 'Kneel on the mat, reach arms forward, and rest your forehead down to release shoulder and lumbar strain.',
    id: 'Childs_Pose',
    videoId: 'zqwK6J3yHfA',
  },
  {
    title: 'Seated Forward Fold',
    body: 'Sit tall, reach toward your feet, and fold forward over straight legs to stretch the posterior chain.',
    id: 'Seated_Floor_Hamstring_Stretch',
    videoId: 'wr_8aak4Wbc',
  },
  {
    title: 'Reclining Pigeon Pose (Thread the Needle)',
    body: 'Lie on your back, cross one ankle over the opposite knee, and pull your thigh toward your chest to release glutes.',
    id: 'Lying_Glute',
    videoId: 'WDOBkhKEuu0',
  },
  {
    title: 'Supine Spinal Twist',
    body: 'Lie down, bring one knee across your torso to the floor, and extend the opposite arm out flat.',
    id: 'Knee_Across_The_Body',
    videoId: 'hZduN8rruKM',
  },
  {
    title: 'Legs-Up-the-Wall',
    body: 'Rest flat on your back with your legs extended vertically up a wall to aid circulation and nervous system recovery.',
    videoId: 'nYqIz8oMxRc',
    endFrame: 1,
  },
];

const YOGA_WARMUP_LOWER: FixedStep[] = [
  {
    title: 'Low Lunge Flow',
    body: 'Step one foot forward, rock gently between a deep lunge and a straight-leg hamstring stretch to warm the hip flexors and backs of the legs.',
    videoId: 'a_g_qUpsBII',
    endFrame: 1,
  },
  {
    title: 'Down Dog to Low Lunge Flow',
    body: 'Flow from downward dog into a low lunge and back, alternating legs, to open the hips and stretch the calves and hamstrings dynamically.',
    videoId: 'a_g_qUpsBII',
    endFrame: 1,
  },
  {
    title: 'Wide-Leg Forward Fold',
    body: 'Feet wide, fold forward and let the head hang to release the inner thighs and hamstrings.',
    videoId: 'F7you4Sw1o0',
    endFrame: 2,
  },
  {
    title: 'Standing Figure-Four',
    body: 'Balance on one leg, cross the other ankle over the knee, and hinge slightly forward to open the glute and hip.',
    videoId: 'uikhOx-AvxI',
  },
  {
    title: 'Chair Pose Pulses',
    body: 'Sit the hips back like a squat and pulse gently to wake up the quads and glutes before loading.',
    videoId: 'UEsSjeq5B18',
    endFrame: 2,
  },
];

const YOGA_COOLDOWN_LOWER: FixedStep[] = [
  {
    title: 'Reclining Pigeon Pose (Thread the Needle)',
    body: 'Lie on your back, cross one ankle over the opposite knee, and pull your thigh toward your chest to release glutes.',
    id: 'Lying_Glute',
    videoId: 'WDOBkhKEuu0',
  },
  {
    title: 'Happy Baby Pose',
    body: 'Lie on your back, grab the outer edges of your feet, and gently rock side to side to release the hips and low back.',
    id: 'Lying_Bent_Leg_Groin',
    videoId: 'JJAHGpe0AVU',
  },
  {
    title: 'Seated Forward Fold',
    body: 'Sit tall, reach toward your feet, and fold forward over straight legs to stretch the posterior chain.',
    id: 'Seated_Floor_Hamstring_Stretch',
    videoId: 'wr_8aak4Wbc',
  },
  {
    title: 'Supine Figure-Four Twist',
    body: 'Lie on your back, cross one ankle over the opposite knee, then let both knees fall to one side to release the glutes and low back together.',
    id: 'Knee_Across_The_Body',
    videoId: 'hZduN8rruKM',
  },
  {
    title: 'Legs-Up-the-Wall',
    body: 'Rest flat on your back with your legs extended vertically up a wall to aid circulation and nervous system recovery.',
    videoId: 'nYqIz8oMxRc',
    endFrame: 1,
  },
];

/** Fixed 5-pose Yoga sequence, no levels. Upper/Lower and warmup/cooldown each get their own list. */
export function guidedYogaCircuit(slot: OptionalSlot, region: OptionalRegion): OptionalCircuitStep[] {
  const bank =
    region === 'lower'
      ? slot === 'warmup'
        ? YOGA_WARMUP_LOWER
        : YOGA_COOLDOWN_LOWER
      : slot === 'warmup'
        ? YOGA_WARMUP_UPPER
        : YOGA_COOLDOWN_UPPER;
  return renderFixed(bank, YOGA_HOLD_SECONDS);
}

const ABS_EXERCISES: FixedStep[] = [
  {
    title: 'Forearm Plank',
    body: 'Keep your elbows under your shoulders, glutes squeezed, and core engaged to maintain a straight line from head to heels.',
    videoId: 's6coxb732BA',
    endFrame: 3,
  },
  {
    title: 'Bicycle Crunches',
    body: 'Lie on your back, bring opposite elbow to opposite knee while extending the other leg, moving with slow, controlled tempo.',
    videoId: 'PAEo-zRSanM',
  },
  {
    title: 'Dead Bugs',
    body: 'On your back with arms raised and knees at 90 degrees, lower opposite arm and leg toward the floor simultaneously without letting your lower back arch.',
    id: 'Dead_Bug',
    videoId: '4XLEnwUr1d8',
  },
  {
    title: 'Russian Twists',
    body: 'Sit with torso angled back at 45 degrees, feet elevated or grounded, and rotate your shoulders side-to-side while maintaining a neutral spine.',
    id: 'Russian_Twist',
    videoId: 'RUNrHkbP4Pc',
  },
  {
    title: 'Reverse Crunches',
    body: 'Contract your lower abs to curl your hips off the floor, bringing knees toward your chest without using momentum.',
    videoId: 'ue6j6k0Vgbc',
  },
];

/** 5 exercises x 2 rounds = 10 work intervals. Rest between intervals is a UI-level timer (ABS_REST_SECONDS), not part of this data. Identical for both slots. */
export function absCircuit(): OptionalCircuitStep[] {
  return [...renderFixed(ABS_EXERCISES, ABS_WORK_SECONDS), ...renderFixed(ABS_EXERCISES, ABS_WORK_SECONDS)];
}
