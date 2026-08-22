import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';

export type { CoachTone };

type LinePack = {
  initial: readonly string[];
  mid: readonly string[];
  final: readonly string[];
  exit: readonly string[];
  complete: readonly string[];
  setUpTitle: string;
  setUpBody: string;
  setDownTitle: string;
  setDownBody: string;
};

const MASTER: LinePack = {
  initial: [
    'Stop staring. Fix your effort.',
    'Heavy load today, total submission tomorrow. Drive.',
    'Control every single rep for me.',
    'Respect the iron. I own you.',
  ],
  mid: [
    "Earn my praise. Don't waste my time.",
    "You didn't come this far to go soft.",
    "That burn means you're mine. Embrace it.",
    'Perfect form. No excuses. Push!',
  ],
  final: [
    'Empty the tank. Collapse at my feet later.',
    'Those last two reps belong to me.',
    'Make it look effortless for Master Workit.',
    'Finish it. Make me proud.',
  ],
  exit: [
    'DO NOT RACK THAT WEIGHT. Get back under the bar, sissy!',
    'Did I give you permission to quit? Hands back on the bar.',
    "Excuses don't build muscle. Move your body for Master Workit NOW!",
    'Look in the mirror. Are you my good man, or a quitter?',
    "Fatigue is in your head. Give me that extra 20% right now!",
    'Walk out early and carry the shame all day. Pick one!',
    'Break that weak habit right now. You belong under that iron.',
    'Pain is temporary. Quitting is permanent. Pick up those dumbbells!',
    "Stand up, lock in, and drive. I'm watching you.",
    'You want results? Pay the tax to Master Workit. Complete the reps!',
    "Stop feeling sorry for yourself. Sweat isn't acid—LIFT!",
    'You came here to suffer and submit to the growth. GET TO WORK!',
    'Stop acting like a spectator. Show me maximum effort!',
    'NO NEGOTIATIONS. Grab the handles and PUSH!',
    "You don't leave until every rep is DONE. Back to position!",
    "Don't you dare give up on set three. Remember who you're doing this for!",
    'Decide right now to be stronger than your laziness. Obey!',
    'Shut up and LIFT. Stop rationalizing quitting to me!',
    'Leave the weak crowd behind. Lock into this set right now.',
    'Your progress lives in the reps you want to skip. Do them for me!',
    'Zero compromise, pup. Deliver the full workout!',
    "Show me what you're made of. Mind in the fight, NOW!",
    "FINISH THE JOB. Leave it all on the floor, or don't bother coming back!",
  ],
  complete: [
    'MISSION ACCOMPLISHED. Stand tall and let me see all that sweat—you fucking earned it.',
    "ZERO REGRETS. You pushed through and didn't break. That was hot as hell.",
    "EARNED, NOT GIVEN. You worked your ass off for every rep. Damn right I'm proud.",
    'THAT IS HOW YOU FINISH. Watching you drive through that last rep turned me completely on.',
    'PROOF OF DISCIPLINE. You showed real toughness today. Exactly what I need from you.',
    'THE TAX IS PAID. Paid in full with sweat and power. Beautiful.',
    'ANOTHER DEPOSIT IN THE BANK. You made yourself so much stronger today.',
    "YOU CONQUERED THE BAR. Walk out of here with your chest up, big guy. You're mine.",
    'DISCOMFORT IS NOW GROWTH. You took the pain like a sissy, now enjoy the gains.',
    'NO SHORTCUTS TAKEN. You did every single thing I demanded. Perfect.',
    'VICTORY IS A HABIT. You delivered today. Now get home to me.',
    "BREAD IN THE OVEN. The hard part's over. Now let me take complete care of you.",
    'YOU BEAT YOUR OLD SELF. You showed up, took control, and dominated that rack.',
    'PAIN LEAVES, PRIDE STAYS. Seeing how hard you worked for me today is everything.',
    'STAND UP AND OXYGENATE. Breathe deep, handsome. You pushed your limits and won.',
    'UNSTOPPABLE WORK ETHIC. Most guys would have bitched out, but you stayed strong and finished.',
    'THE HARD PART IS OVER. You faced the iron, took the hit, and came out on top.',
    'JOB DONE. FULL STOP. You gave 100% and looked fucking incredible doing it.',
    "CHARACTER BUILT. You didn't just build muscle—you showed me real raw strength.",
    'WALK OUT PROUD. Zero excuses, total progress. You made me so damn proud today.',
    'DOMINATED. From rep one to the final lockout, you were in total control.',
    'ANOTHER BRICK IN THE WALL. That was serious work today.',
    'YOU DUG DEEP AND DELIVERED. When it got heavy, you found another gear. Fucking amazing.',
    'NOW RECOVER LIKE A PRO. The battle is won. Now come home and let me reward you.',
  ],
  setUpTitle: 'GOOD MAN',
  setUpBody: 'I like where this is going',
  setDownTitle: "What's happening here",
  setDownBody: 'Are we playing dolls? Get that weight back up...',
};

const SERGEANT: LinePack = {
  initial: [
    'Unclench your jaw and invite ease into your space.',
    'We carry heavy things today so we can drop the weight tomorrow. Flow with it.',
    'Honor your movement. Breathe intention into every rep.',
    'Respect the iron, but stay rooted in your center. You are grounded here.',
  ],
  mid: [
    'Stay present in this breath. You are fully capable of this work.',
    'Soften where you can, hold strong where you must.',
    'That warmth in your muscles is just energy moving. Welcome it.',
    'Gentle alignment, pure presence. You are doing so well.',
  ],
  final: [
    'Release what no longer serves you. Save nothing for later.',
    'These final moments are where your growth blossoms. Stay with it.',
    'Let your effort feel light, even when the weight is heavy.',
    'Stay in this present moment. Finish this breath, finish this movement.',
  ],
  exit: [
    "Breathe, stay present, and stay right here on your mat. You aren't done yet.",
    "Listen to your body, but don't let a passing thought cut your journey short.",
    "Release the story that you can't. You have so much power left inside you.",
    'Check in with your spirit. Are you honoring your practice, or bowing out early?',
    'The fatigue is just a wave. Ride it out—you have so much deeper strength to tap into.',
    'Leaving early leaves your practice unfinished. Stay and hold this space.',
    'Gently break that urge to pull away. Stay grounded in the work.',
    'Uncomfortable feelings pass. Stay present with the weights and breathe.',
    "Stand tall, find your focal point, and press forward. I'm right here with you.",
    'Honor the commitment you made when you stepped onto this floor. Complete the cycle.',
    'Soften your thoughts. Sweat is just your body letting go. Lift with love.',
    'You came here to expand your capacity. Trust the process and keep moving.',
    "Don't drift away now. Bring all your beautiful energy right back to this rep.",
    'Gently hold space for the discomfort. Grab the handles and flow into it.',
    'Stay present for every single movement remaining. Return to your stance.',
    'Honor set three. Remember the loving intention that brought you here today.',
    'Choose self-compassion through effort. Be stronger than the urge to stop.',
    'Soften your mind, deepen your breath, and lift. Let go of the inner noise.',
    'Step away from the noise of the day and anchor yourself right into this set.',
    'The deepest transformation happens right on the edge of wanting to stop.',
    'No compromises needed. Give yourself the gift of a complete practice.',
    'Feel your inner fire. Bring your heart back into the movement right now.',
    'Complete this journey. Leave your energy here, light and fulfilled.',
    'Return to your breath, reset your intention, and complete this final cycle.',
  ],
  complete: [
    'Practice complete. Inhale fully, exhale completely, and honor all that hard work.',
    'Zero regrets. You stayed present, honored your body, and saw it through. Beautiful.',
    'Earned through grace and effort. Every rep was a gift to your future self.',
    'What a beautiful finish. Watching you move through that last movement was inspiring.',
    'Proof of pure devotion. You showed such beautiful discipline today.',
    'The practice is complete. You gave your energy fully and freely.',
    'Another seed planted. You are so much stronger and more rooted than when you started.',
    'You met the challenge with grace. Stand tall, open your heart, and shine.',
    'Discomfort has transformed into growth. Let that warm energy soak into your spirit.',
    'Full presence, full completion. You honored every single request of your practice.',
    'Victory is peace. You showed up for yourself today—now step gently into your day.',
    'The active work is done. Now allow yourself to rest, refuel, and receive.',
    'You met your past edge and expanded beyond it. Simply beautiful.',
    'The temporary strain fades, but the peace of finishing stays with you.',
    'Stand tall, breathe deep, and soak in all that incredible oxygen. You did it.',
    'Unshakable presence. When it was tough, you stayed rooted and completed your cycle.',
    'The peak of the mountain is behind you. Take a soft breath and enjoy the descent.',
    'Effort complete. You gave 100% of your heart, and it showed in every movement.',
    "Inner strength built. You didn't just move weights—you cultivated deep inner resilience.",
    'Walk away with a quiet heart. Zero excuses, total harmony with your goal today.',
    'Flowed with power from start to finish. You were in total harmony with your body.',
    'Another layer of strength added. Lovely, dedicated work today.',
    'You listened, you dug deep, and you expanded your light. So grateful for your effort.',
    'Now nourish yourself like the athlete you are. Hydrate, rest, and carry this peace.',
  ],
  setUpTitle: 'This is growth',
  setUpBody: 'I like where this is going. Stay with this energy.',
  setDownTitle: 'Come back to your last weight',
  setDownBody: 'This dip is a whisper, not a stop. Return to what you just lifted.',
};

const PACKS: Record<CoachTone, LinePack> = {
  master: MASTER,
  sergeant: SERGEANT,
};

export const COACH_LINES = {
  initial: MASTER.initial,
  mid: MASTER.mid,
  final: MASTER.final,
} as const;

export const EXIT_LINES = MASTER.exit;
export const COMPLETE_LINES = MASTER.complete;

export type WorkoutPhase = 'initial' | 'mid' | 'final';

const lastByKey: Record<string, string> = {};

function packFor(tone?: CoachTone | null): LinePack {
  return PACKS[normalizeCoachTone(tone)];
}

function pickFrom(pool: readonly string[], key: string): string {
  const last = lastByKey[key];
  const choices = pool.filter((line) => line !== last);
  const source = choices.length > 0 ? choices : pool;
  const line = source[Math.floor(Math.random() * source.length)];
  lastByKey[key] = line;
  return line;
}

export function workoutPhase(completedSets: number, totalSets: number): WorkoutPhase {
  if (totalSets <= 1) return 'final';
  const progress = completedSets / totalSets;
  if (progress <= 1 / 3) return 'initial';
  if (progress <= 2 / 3) return 'mid';
  return 'final';
}

export function pickCoachLine(
  completedSets: number,
  totalSets: number,
  tone?: CoachTone | null
): string {
  const phase = workoutPhase(completedSets, totalSets);
  return pickFrom(packFor(tone)[phase], `coach:${normalizeCoachTone(tone)}:${phase}`);
}

export function pickExitLine(tone?: CoachTone | null): string {
  return pickFrom(packFor(tone).exit, `exit:${normalizeCoachTone(tone)}`);
}

export function pickCompleteLine(tone?: CoachTone | null): string {
  return pickFrom(packFor(tone).complete, `complete:${normalizeCoachTone(tone)}`);
}

export function setProgressCopy(
  direction: 'up' | 'down',
  tone?: CoachTone | null
): { title: string; body: string } {
  const pack = packFor(tone);
  if (direction === 'up') {
    return { title: pack.setUpTitle, body: pack.setUpBody };
  }
  return { title: pack.setDownTitle, body: pack.setDownBody };
}
