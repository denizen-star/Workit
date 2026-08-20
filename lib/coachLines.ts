export const COACH_LINES = {
  initial: [
    "Stop staring. Fix your effort.",
    "Heavy load today, total submission tomorrow. Drive.",
    "Control every single rep for me.",
    "Respect the iron. I own you.",
  ],
  mid: [
    "Earn my praise. Don't waste my time.",
    "You didn't come this far to go soft.",
    "That burn means you're mine. Embrace it.",
    "Perfect form. No excuses. Push!",
  ],
  final: [
    "Empty the tank. Collapse at my feet later.",
    "Those last two reps belong to me.",
    "Make it look effortless for your Sir.",
    "Finish it. Make me proud.",
  ],
} as const;

export const EXIT_LINES = [
  "DO NOT RACK THAT WEIGHT. Get back under the bar, boy!",
  "Did I give you permission to quit? Hands back on the bar.",
  "Excuses don't build muscle. Move your body for Sir NOW!",
  "Look in the mirror. Are you my good boy, or a quitter?",
  "Fatigue is in your head. Give me that extra 20% right now!",
  "Walk out early and carry the shame all day. Pick one!",
  "Break that weak habit right now. You belong under that iron.",
  "Pain is temporary. Quitting is permanent. Pick up those dumbbells!",
  "Stand up, lock in, and drive. I'm watching you.",
  "You want results? Pay the tax to your Sir. Complete the reps!",
  "Stop feeling sorry for yourself. Sweat isn't acid—LIFT!",
  "You came here to suffer and submit to the growth. GET TO WORK!",
  "Stop acting like a spectator. Show me maximum effort!",
  "NO NEGOTIATIONS. Grab the handles and PUSH!",
  "You don't leave until every rep is DONE. Back to position!",
  "Don't you dare give up on set three. Remember who you're doing this for!",
  "Decide right now to be stronger than your laziness. Obey!",
  "Shut up and LIFT. Stop rationalizing quitting to me!",
  "Leave the weak crowd behind. Lock into this set right now.",
  "Your progress lives in the reps you want to skip. Do them for me!",
  "Zero compromise, pup. Deliver the full workout!",
  "Show me what you're made of. Mind in the fight, NOW!",
  "FINISH THE JOB. Leave it all on the floor, or don't bother coming back!",
] as const;

export const COMPLETE_LINES = [
  "MISSION ACCOMPLISHED. Stand tall and let me see all that sweat—you fucking earned it.",
  "ZERO REGRETS. You pushed through and didn't break. That was hot as hell.",
  "EARNED, NOT GIVEN. You worked your ass off for every rep. Damn right I'm proud.",
  "THAT IS HOW YOU FINISH. Watching you drive through that last rep turned me completely on.",
  "PROOF OF DISCIPLINE. You showed real toughness today. Exactly what I need from you.",
  "THE TAX IS PAID. Paid in full with sweat and power. Beautiful.",
  "ANOTHER DEPOSIT IN THE BANK. You made yourself so much stronger today.",
  "YOU CONQUERED THE BAR. Walk out of here with your chest up, big guy. You're mine.",
  "DISCOMFORT IS NOW GROWTH. You took the pain like a man, now enjoy the gains.",
  "NO SHORTCUTS TAKEN. You did every single thing I demanded. Perfect.",
  "VICTORY IS A HABIT. You delivered today. Now get home to me.",
  "BREAD IN THE OVEN. The hard part's over. Now let me take complete care of you.",
  "YOU BEAT YOUR OLD SELF. You showed up, took control, and dominated that rack.",
  "PAIN LEAVES, PRIDE STAYS. Seeing how hard you worked for me today is everything.",
  "STAND UP AND OXYGENATE. Breathe deep, handsome. You pushed your limits and won.",
  "UNSTOPPABLE WORK ETHIC. Most guys would have bitched out, but you stayed strong and finished.",
  "THE HARD PART IS OVER. You faced the iron, took the hit, and came out on top.",
  "JOB DONE. FULL STOP. You gave 100% and looked fucking incredible doing it.",
  "CHARACTER BUILT. You didn't just build muscle—you showed me real raw strength.",
  "WALK OUT PROUD. Zero excuses, total progress. You made me so damn proud today.",
  "DOMINATED. From rep one to the final lockout, you were in total control.",
  "ANOTHER BRICK IN THE WALL. That was serious work today.",
  "YOU DUG DEEP AND DELIVERED. When it got heavy, you found another gear. Fucking amazing.",
  "NOW RECOVER LIKE A PRO. The battle is won. Now come home and let me reward you.",
] as const;

export type WorkoutPhase = keyof typeof COACH_LINES;

let lastLine = "";
let lastExitLine = "";
let lastCompleteLine = "";

export function workoutPhase(completedSets: number, totalSets: number): WorkoutPhase {
  if (totalSets <= 1) return "final";
  const progress = completedSets / totalSets;
  if (progress <= 1 / 3) return "initial";
  if (progress <= 2 / 3) return "mid";
  return "final";
}

export function pickCoachLine(completedSets: number, totalSets: number): string {
  const phase = workoutPhase(completedSets, totalSets);
  const pool = COACH_LINES[phase];
  const choices = pool.filter((line) => line !== lastLine);
  const source = choices.length > 0 ? choices : pool;
  const line = source[Math.floor(Math.random() * source.length)];
  lastLine = line;
  return line;
}

export function pickExitLine(): string {
  const choices = EXIT_LINES.filter((line) => line !== lastExitLine);
  const source = choices.length > 0 ? choices : EXIT_LINES;
  const line = source[Math.floor(Math.random() * source.length)];
  lastExitLine = line;
  return line;
}

export function pickCompleteLine(): string {
  const choices = COMPLETE_LINES.filter((line) => line !== lastCompleteLine);
  const source = choices.length > 0 ? choices : COMPLETE_LINES;
  const line = source[Math.floor(Math.random() * source.length)];
  lastCompleteLine = line;
  return line;
}
