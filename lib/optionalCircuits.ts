import {
  type OptionalCircuitStep,
  type OptionalLevel,
  type OptionalRegion,
  type OptionalSlot,
  type OptionalTrack,
} from '@/lib/optionals';

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

const STRETCH_UPPER: Record<OptionalLevel, Cue[]> = {
  easy: [
    {
      title: 'Neck',
      warmup: 'Slow look left and right. Switch sides halfway. No forcing.',
      cooldown: 'Softer turns. Let the neck empty.',
      id: 'Side_Neck_Stretch',
      videoId: 'was4RtzpfJs',
    },
    {
      title: 'Shoulders',
      warmup: 'Roll them back. Open the chest a little.',
      cooldown: 'Slow rolls. Drop what the press left behind.',
      id: 'Shoulder_Circles',
      videoId: 'NS64IgKUyeY',
    },
    {
      title: 'Chest',
      warmup: 'Hands on a wall or behind you. Open without a fight.',
      cooldown: 'Same wall. Stay. Breathe into the stretch.',
      id: 'Chest_And_Front_Of_Shoulder_Stretch',
      videoId: 'NS64IgKUyeY',
    },
    {
      title: 'Lats',
      warmup: "Child's pose or a wall reach. Walk the hands away. Soft elbows.",
      cooldown: 'Longer reach. Let the lats melt after the rows.',
      id: 'Cat_Stretch',
      videoId: 'eqVMAPM00DM',
    },
    {
      title: 'Thoracic',
      warmup: 'Cat-cow or an easy open-book on your side. Move with the breath.',
      cooldown: 'Slower cat-cow. Nothing left to prove in the spine.',
      id: 'Cat_Stretch',
      videoId: 'y39PrKY_4JM',
    },
    {
      title: 'Wrists',
      warmup: 'Palms on a wall, fingers down, or an easy overhead triceps fold.',
      cooldown: 'Wrist fold, then shake the hands out.',
      id: 'Shoulder_Circles',
      videoId: 'NS64IgKUyeY',
    },
  ],
  medium: [
    {
      title: 'Cat-cow',
      warmup: 'On all fours. Round and arch with the breath.',
      cooldown: 'Slower rounds. Let the upper back go.',
      id: 'Cat_Stretch',
      videoId: 'y39PrKY_4JM',
    },
    {
      title: 'Thread-the-needle',
      warmup: 'Slide one arm under the chest. Both sides.',
      cooldown: 'Stay in the twist a little longer. Switch.',
      id: 'Cat_Stretch',
      videoId: 'y39PrKY_4JM',
    },
    {
      title: 'Puppy pose',
      warmup: 'Hips over knees. Walk the hands forward. Chest toward the floor.',
      cooldown: 'Same shape. Softer elbows. Long exhales.',
      id: 'Cat_Stretch',
      videoId: 'eqVMAPM00DM',
    },
    {
      title: 'Eagle arms',
      warmup: 'Wrap the arms. Lift the elbows. Both sides if one wrap is enough.',
      cooldown: 'Cow-face or eagle. Unwind slow.',
      id: 'Shoulder_Circles',
      videoId: 'NS64IgKUyeY',
    },
    {
      title: 'Mermaid',
      warmup: 'Sit. One hand down. Other arm overhead. Side body. Switch halfway.',
      cooldown: 'Same side bend. Less reach, more breath.',
      id: 'Side_Neck_Stretch',
      videoId: 'was4RtzpfJs',
    },
    {
      title: 'Supine twist',
      warmup: 'On your back, knees together, let them fall to one side. Switch halfway.',
      cooldown: 'Knees heavy. Look the other way. Then rest.',
      id: 'Cat_Stretch',
      videoId: 'y39PrKY_4JM',
    },
  ],
  hard: [
    {
      title: 'Down dog to puppy',
      warmup: 'Down dog first. Then walk the hands and drop the chest. Stay.',
      cooldown: 'Skip the push. Puppy only. Long stay.',
      id: 'Cat_Stretch',
      videoId: 'eqVMAPM00DM',
    },
    {
      title: 'Thread-the-needle',
      warmup: 'Arm under, then stay in the bind. Both sides.',
      cooldown: 'Bind if it is kind. No yanking the shoulder.',
      id: 'Cat_Stretch',
      videoId: 'y39PrKY_4JM',
    },
    {
      title: 'Long puppy',
      warmup: 'Chest lower. Shoulders load. Ribs quiet.',
      cooldown: 'Foreheads toward the floor. Soft neck.',
      id: 'Cat_Stretch',
      videoId: 'eqVMAPM00DM',
    },
    {
      title: 'Cow-face arms',
      warmup: 'One elbow up, one down. Both sides. Longer than Medium.',
      cooldown: 'Same bind. Less pull.',
      id: 'Shoulder_Circles',
      videoId: 'NS64IgKUyeY',
    },
    {
      title: 'Mermaid',
      warmup: 'Deeper side bend. Both sides. Stay at the end.',
      cooldown: 'Side bend, then sit tall and breathe.',
      id: 'Side_Neck_Stretch',
      videoId: 'was4RtzpfJs',
    },
    {
      title: 'Supine twist',
      warmup: 'Arm on the floor. Look the other way. Then a short child’s pose.',
      cooldown: 'Twist, then child’s pose until the hold ends.',
      id: 'Cat_Stretch',
      videoId: 'eqVMAPM00DM',
    },
  ],
};

const STRETCH_LOWER: Record<OptionalLevel, Cue[]> = {
  easy: [
    {
      title: 'Calves',
      warmup: 'Heel down, knee soft. Switch sides halfway.',
      cooldown: 'Heel down. Let the legs empty.',
      id: 'Standing_Gastrocnemius_Calf_Stretch',
      videoId: 'i1eJqJ3v3lQ',
    },
    {
      title: 'Hip flexors',
      warmup: 'Half-kneeling lunge. Back glute squeezed. Not a backbend.',
      cooldown: 'Same kneel. Softer. You already did the work.',
      id: 'Groiners',
      videoId: 'YQmpO9VT2X4',
    },
    {
      title: 'Adductors',
      warmup: 'Easy side lunge. Sit between the knees as far as is kind.',
      cooldown: 'Wide knees. No bounce.',
      id: 'Groiners',
      videoId: 'YQmpO9VT2X4',
    },
    {
      title: 'Quads',
      warmup: 'Stand or lie on your side. Heel toward the glute. Switch halfway.',
      cooldown: 'Same fold. Slower.',
      id: 'Split_Squat_with_Dumbbells',
      videoId: 'BhQimqvU1tM',
    },
    {
      title: 'Figure-four',
      warmup: 'Ankle on the other knee. Sit tall, then fold a little.',
      cooldown: 'Reclined figure-four. Heavy hips.',
      id: 'Butt_Lift_Bridge',
      videoId: '0_zPqA65Nok',
    },
    {
      title: 'Hamstrings',
      warmup: 'Easy fold or a long sit. Soft knees. No yanking.',
      cooldown: 'Longer fold. Soft knees still.',
      id: 'Romanian_Deadlift',
      videoId: 'wr_8aak4Wbc',
    },
  ],
  medium: [
    {
      title: 'Down dog',
      warmup: 'Pedal the heels. Soft knees if the hamstrings talk.',
      cooldown: 'Down dog, then drop to the knees when you need.',
      id: 'Cat_Stretch',
      videoId: 'eqVMAPM00DM',
    },
    {
      title: 'Low lunge',
      warmup: 'Back knee down. Both sides. Hips square.',
      cooldown: 'Same lunge. Less depth, more breath.',
      id: 'Groiners',
      videoId: 'YQmpO9VT2X4',
    },
    {
      title: 'Lizard',
      warmup: 'Hands inside the front foot. Elbows toward the floor if it is kind.',
      cooldown: 'Lizard, stay. Switch halfway.',
      id: 'Groiners',
      videoId: 'YQmpO9VT2X4',
    },
    {
      title: 'Half split',
      warmup: 'Front heel. Hips back. Fold over the leg.',
      cooldown: 'Same fold. Softer knee.',
      id: 'Romanian_Deadlift',
      videoId: 'wr_8aak4Wbc',
    },
    {
      title: 'Reclined pigeon',
      warmup: 'Figure-four on your back. Draw the thigh in.',
      cooldown: 'Same shape. Let the hip sink.',
      id: 'Butt_Lift_Bridge',
      videoId: '0_zPqA65Nok',
    },
    {
      title: 'Butterfly',
      warmup: 'Soles together. Or happy baby if the hips prefer it.',
      cooldown: 'Butterfly or happy baby. Stay easy.',
      id: 'Groiners',
      videoId: 'YQmpO9VT2X4',
    },
  ],
  hard: [
    {
      title: 'Down dog',
      warmup: 'Long stay. Heels working toward the floor.',
      cooldown: 'Shorter dog, then child’s pose.',
      id: 'Cat_Stretch',
      videoId: 'eqVMAPM00DM',
    },
    {
      title: 'Low lunge reach',
      warmup: 'Knee down. Arm up on the back-leg side. Tiny side bend. Switch.',
      cooldown: 'Lunge without the reach if the hip is done.',
      id: 'Groiners',
      videoId: 'YQmpO9VT2X4',
    },
    {
      title: 'Lizard',
      warmup: 'Both sides. Stay at the end range.',
      cooldown: 'Same pose. No extra depth.',
      id: 'Groiners',
      videoId: 'YQmpO9VT2X4',
    },
    {
      title: 'Half split',
      warmup: 'Longer fold. Hips point down the mat.',
      cooldown: 'Fold, then sit up and shake the legs.',
      id: 'Romanian_Deadlift',
      videoId: 'wr_8aak4Wbc',
    },
    {
      title: 'Pigeon',
      warmup: 'Front shin across. Fold only if the hip allows.',
      cooldown: 'Pigeon or reclined figure-four. No forcing.',
      id: 'Butt_Lift_Bridge',
      videoId: '0_zPqA65Nok',
    },
    {
      title: 'Frog to fold',
      warmup: 'Wide-knee child’s pose or frog, then a long hamstring fold.',
      cooldown: 'Wide knees, then a soft forward fold until the hold ends.',
      id: 'Groiners',
      videoId: 'YQmpO9VT2X4',
    },
  ],
};

const CORE_UPPER_EASY: Cue[] = [
  {
    title: 'Dead bug',
    warmup: 'Back stays on the floor. Slow opposite arm and leg.',
    cooldown: 'Slower than the warmup. Floor is a friend.',
    id: 'Dead_Bug',
    videoId: '4XLEnwUr1d8',
  },
  {
    title: 'Bird dog',
    warmup: 'Opposite arm and leg. Pause. Not a long front plank.',
    cooldown: 'Smaller reach. Quiet hips.',
    id: 'Superman',
    videoId: 'cc6UVRS7PW4',
  },
  {
    title: 'Heel taps',
    warmup: 'Knees bent. Tap one heel then the other. Soft.',
    cooldown: 'Same taps. Smaller.',
    id: 'Alternate_Heel_Touchers',
    videoId: '9bR-elyolBQ',
  },
  {
    title: 'Side-lying hold',
    warmup: 'On your side. Knees down. Hips stacked. Switch halfway.',
    cooldown: 'Short side hold. Then roll onto your back.',
    id: 'Side_Bridge',
    videoId: 'rCxF2nG9vQ0',
  },
  {
    title: 'Easy hollow',
    warmup: 'Knees bent. Low back glued down. Shoulders heavy.',
    cooldown: 'Even smaller. Stop while it is kind.',
    id: 'Crunches',
    videoId: 'RUNrHkbP4Pc',
  },
  {
    title: 'Breathe down',
    warmup: "On your back, hands on ribs. Long easy breaths.",
    cooldown: "Child's pose or on your back. Long easy breaths.",
    id: 'Cat_Stretch',
    videoId: 'eqVMAPM00DM',
  },
];

const CORE_UPPER_MEDIUM: Cue[] = [
  {
    title: 'Pilates breath',
    warmup: 'Ribs in. Long exhale. Quiet belly.',
    cooldown: 'Same breath. You already worked.',
    id: 'Cat_Stretch',
    videoId: 'eqVMAPM00DM',
  },
  {
    title: 'Single-leg stretch',
    warmup: 'One knee in. One long. Switch. Head can stay down.',
    cooldown: 'Slower switches. Neck soft.',
    id: 'Alternate_Heel_Touchers',
    videoId: '9bR-elyolBQ',
  },
  {
    title: 'Bird dog',
    warmup: 'Pause at the end of each reach.',
    cooldown: 'Hold the shape. Less reach.',
    id: 'Superman',
    videoId: 'cc6UVRS7PW4',
  },
  {
    title: 'Criss-cross',
    warmup: 'Small. Shoulders only as high as the neck stays kind.',
    cooldown: 'Tiny rotation. Or skip to a side breath if the neck talks.',
    id: 'Crunches',
    videoId: 'RUNrHkbP4Pc',
  },
  {
    title: 'Side-lying kick',
    warmup: 'Small front and back. Both sides.',
    cooldown: 'Even smaller kicks. Then rest on that side.',
    id: 'Side_Bridge',
    videoId: 'rCxF2nG9vQ0',
  },
  {
    title: 'Rest',
    warmup: 'Knees into the chest, or hands on ribs.',
    cooldown: 'Knees in. Let the belly go.',
    id: 'Cat_Stretch',
    videoId: 'eqVMAPM00DM',
  },
];

const CORE_UPPER_MEDIUM_B: Cue[] = [
  CORE_UPPER_MEDIUM[0],
  CORE_UPPER_MEDIUM[1],
  CORE_UPPER_MEDIUM[2],
  {
    title: 'Side-lying kick',
    warmup: 'Skip the crunch series. Small front and back kicks. Both sides.',
    cooldown: 'Side kicks only. Neck stays down.',
    id: 'Side_Bridge',
    videoId: 'rCxF2nG9vQ0',
  },
  CORE_UPPER_MEDIUM[4],
  CORE_UPPER_MEDIUM[5],
];

const CORE_UPPER_HARD: Cue[] = [
  {
    title: 'The hundred',
    warmup: 'Knees tabletop. Arms pump. Breath in fives.',
    cooldown: 'Half the pumps. Or hold tabletop and breathe.',
    id: 'Crunches',
    videoId: 'RUNrHkbP4Pc',
  },
  {
    title: 'Double-leg stretch',
    warmup: 'Reach long. Circle home. Back stays down.',
    cooldown: 'Shorter reach. Same back rule.',
    id: 'Dead_Bug',
    videoId: '4XLEnwUr1d8',
  },
  {
    title: 'Criss-cross',
    warmup: 'Slower. Both sides. Neck kind.',
    cooldown: 'Tiny. Or stay in tabletop.',
    id: 'Crunches',
    videoId: 'RUNrHkbP4Pc',
  },
  {
    title: 'Side kick series',
    warmup: 'Front, back, then a small lift. Both sides.',
    cooldown: 'Front and back only.',
    id: 'Side_Bridge',
    videoId: 'rCxF2nG9vQ0',
  },
  {
    title: 'Teaser prep',
    warmup: 'Legs tabletop. Roll the shoulders up. Hold. Not a full teaser unless it is clean.',
    cooldown: 'Shoulders stay down. Hands on ribs.',
    id: 'Crunches',
    videoId: 'RUNrHkbP4Pc',
  },
  {
    title: "Child's pose",
    warmup: 'Hips to heels. Arms long. Stay.',
    cooldown: 'Forehead down. Long breaths until the hold ends.',
    id: 'Cat_Stretch',
    videoId: 'eqVMAPM00DM',
  },
];

const CORE_UPPER_HARD_B: Cue[] = [
  CORE_UPPER_HARD[0],
  CORE_UPPER_HARD[1],
  {
    title: 'Bird dog',
    warmup: 'Pause three counts. No criss-cross on this pull day.',
    cooldown: 'Small bird dog. Then rest.',
    id: 'Superman',
    videoId: 'cc6UVRS7PW4',
  },
  CORE_UPPER_HARD[3],
  CORE_UPPER_HARD[4],
  CORE_UPPER_HARD[5],
];

const CORE_LOWER_EASY: Cue[] = [
  {
    title: 'Dead bug',
    warmup: 'Back stays on the floor. Slow opposite arm and leg.',
    cooldown: 'Slower. Brace like a hinge, then let it go.',
    id: 'Dead_Bug',
    videoId: '4XLEnwUr1d8',
  },
  {
    title: 'Glute bridge',
    warmup: 'Easy squeeze at the top. No rush.',
    cooldown: 'Short squeeze. Then let the floor take you.',
    id: 'Butt_Lift_Bridge',
    videoId: 'X_IGw8U_e38',
  },
  {
    title: 'Heel taps',
    warmup: 'Knees bent, or a marching bridge if the hips want it.',
    cooldown: 'Soft taps. Hips heavy.',
    id: 'Alternate_Heel_Touchers',
    videoId: '9bR-elyolBQ',
  },
  {
    title: 'Bear hold',
    warmup: 'Hands and toes. Knees an inch off the floor. Quiet spine.',
    cooldown: 'Shorter bear, or a dead bug if the wrists are done.',
    id: 'Plank',
    videoId: 'ASdvN_XEl_c',
  },
  {
    title: 'Easy side plank',
    warmup: 'Knees down. Hips high. Switch halfway.',
    cooldown: 'Short side. Then roll down.',
    id: 'Side_Bridge',
    videoId: 'rCxF2nG9vQ0',
  },
  {
    title: 'Cat-cow',
    warmup: 'Round and arch, then child’s pose if you have time.',
    cooldown: 'Cat-cow, then child’s pose. Long breaths.',
    id: 'Cat_Stretch',
    videoId: 'y39PrKY_4JM',
  },
];

const CORE_LOWER_MEDIUM: Cue[] = [
  {
    title: 'Shoulder bridge',
    warmup: 'Squeeze, lower slow.',
    cooldown: 'Smaller lift. Slow lower.',
    id: 'Butt_Lift_Bridge',
    videoId: 'X_IGw8U_e38',
  },
  {
    title: 'Marching bridge',
    warmup: 'One foot lifts. Hips stay level.',
    cooldown: 'Tiny marches. Or a still bridge.',
    id: 'Butt_Lift_Bridge',
    videoId: 'X_IGw8U_e38',
  },
  {
    title: 'Toe taps',
    warmup: 'Tabletop. Tap one toe, then the other. Back stays down.',
    cooldown: 'Slower taps.',
    id: 'Dead_Bug',
    videoId: '4XLEnwUr1d8',
  },
  {
    title: 'Saw',
    warmup: 'Sit tall. Twist. Reach to the little toe. Soft knees.',
    cooldown: 'Smaller twist. Sit on a cushion if you need.',
    id: 'Crunches',
    videoId: 'RUNrHkbP4Pc',
  },
  {
    title: 'Clams',
    warmup: 'Side-lying. Knees bent. Open the top knee. Both sides.',
    cooldown: 'Small clams, or a still side-lying rest.',
    id: 'Butt_Lift_Bridge',
    videoId: 'X_IGw8U_e38',
  },
  {
    title: "Child's pose",
    warmup: 'Hips to heels. Breathe into the back.',
    cooldown: 'Stay. You are cooling.',
    id: 'Cat_Stretch',
    videoId: 'eqVMAPM00DM',
  },
];

const DEAD_BUG_LONG: Cue = {
  title: 'Dead bug',
  warmup: 'Longer. Legs can stay bent. Back glued down. Hip thrust already owns the bridge.',
  cooldown: 'Slow dead bug. No bridge on this hinge day.',
  id: 'Dead_Bug',
  videoId: '4XLEnwUr1d8',
};

const CORE_LOWER_HARD: Cue[] = [
  {
    title: 'Shoulder bridge',
    warmup: 'Two-count hold at the top.',
    cooldown: 'One squeeze, then down.',
    id: 'Butt_Lift_Bridge',
    videoId: 'X_IGw8U_e38',
  },
  {
    title: 'Single-leg bridge',
    warmup: 'Both sides. Hips level.',
    cooldown: 'Shorter, or both feet down.',
    id: 'Butt_Lift_Bridge',
    videoId: 'X_IGw8U_e38',
  },
  {
    title: 'Roll-up',
    warmup: 'Half roll-up if the back talks. Stack one bone at a time.',
    cooldown: 'Tiny curl. Neck soft.',
    id: 'Crunches',
    videoId: 'RUNrHkbP4Pc',
  },
  {
    title: 'Saw',
    warmup: 'Fuller twist. Soft knees still.',
    cooldown: 'Easy twist. Sit tall.',
    id: 'Crunches',
    videoId: 'RUNrHkbP4Pc',
  },
  {
    title: 'Side kick series',
    warmup: 'Front, back, small lift. Both sides.',
    cooldown: 'Front and back only.',
    id: 'Side_Bridge',
    videoId: 'rCxF2nG9vQ0',
  },
  {
    title: 'Boat',
    warmup: 'Knees bent. Hold. Then 90/90 breathing on the back.',
    cooldown: 'Skip the boat. 90/90 on the back until the hold ends.',
    id: 'Crunches',
    videoId: 'RUNrHkbP4Pc',
  },
];

const CORE_LOWER_HARD_B: Cue[] = [
  DEAD_BUG_LONG,
  {
    title: 'Dead bug',
    warmup: 'Keep going. No single-leg bridge. Hip thrust is the day.',
    cooldown: 'Same dead bug. Soft.',
    id: 'Dead_Bug',
    videoId: '4XLEnwUr1d8',
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
