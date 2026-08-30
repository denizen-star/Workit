import { getLinePack, packIsUsable } from '@/lib/coachCatalog';
import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';

export type { CoachTone };

type LinePack = {
  initial: readonly string[];
  mid: readonly string[];
  final: readonly string[];
  exit: readonly string[];
  complete: readonly string[];
  bonusComplete: readonly string[];
  optionalComplete: readonly string[];
  weekPlace1: readonly string[];
  weekPlace2: readonly string[];
  weekPlace3: readonly string[];
  setUpTitle: string;
  setUpBody: string;
  setDownTitle: string;
  setDownBody: string;
  hardness: Record<1 | 2 | 3 | 4 | 5, { title: string; body: string }>;
};

const MASTER: LinePack = {
  initial: [
    'Look at the weight. Then take it from me.',
    'No wandering eyes. Bar, breath, work.',
    'You asked to be trained. This is the tax. Pay it.',
    'Set your feet. I am watching the first inch.',
    'Soft start is for other rooms. Here you lock in.',
    'Unrack. I did not bring you here to negotiate.',
    'Good men start on time. Be one.',
    'The floor is yours. Earn the right to stay on it.',
    'Stop staring. Fix your effort.',
    'Control every single rep for me.',
    'Respect the iron. I own you.',
    'Warm-up is over in your head. Prove it.',
    'Stand tall. Brace. Give me a clean opener.',
    'That first plate is a promise. Do not make me collect later.',
    'Count the breath. Then move. Hesitation is a tell.',
    'I am watching. Take the bar.',
  ],
  mid: [
    'You are not tired. You are being trained. Difference.',
    'Halfway is not a rest. It is a test.',
    'That burn means you are mine. Stay in it.',
    'Brace harder. I can see the leak.',
    'I still own this minute. Spend it lifting.',
    'Form first. Then violence.',
    'If you can talk, you can add a rep. Choose.',
    'Mid-session is where quit invents a story. Do not.',
    "Earn my praise. Don't waste my time.",
    'You did not come this far to go soft.',
    'Sweat is the receipt. Keep writing it.',
    'I want cleaner reps now. Not prettier faces.',
    'The easy sets are gone. This is where I learn your name again.',
    'Stay mean with the iron. Soft hands lose bars.',
    'Give me the next set like it owes you money.',
    'Perfect form. No excuses. Push.',
  ],
  final: [
    'Those last two reps belong to me.',
    'Empty the tank. Collapse later.',
    'Finish it. Make me proud.',
    'Last third. This is the part people remember.',
    'Finish ugly if you have to. Finish.',
    'One more honest set. I will know if you cheat it.',
    'The last plate is still mine until you put it down right.',
    'Last call. Deliver, or explain yourself later.',
    'Make it look effortless for me.',
    'Leave nothing in the rack that I asked for.',
    'You do not get to coast because the clock is almost done.',
    'Lock out like you want to come back tomorrow.',
    'Pain is the door. Walk through it for me.',
    'Stand up. Breathe. Then take what is left.',
    'This is how good men close a session.',
    'Do not save energy for the car. Spend it here.',
  ],
  exit: [
    'Do not rack that. Get back under the bar. Quit is not a name I use for you.',
    'Look at me. My man, or quit? Pick.',
    'No deal. I still own this session. Finish it.',
    'Did I give you permission to quit? Hands back on the bar.',
    'Fatigue is a story. Give me that extra twenty percent. Now.',
    'Walk out and carry it all day. Or stay. Pick.',
    'You belong under that iron. Get back.',
    'Pain is temporary. Quit stays. Pick up the bells.',
    'Stand up. Lock in. Drive. I am watching you.',
    'You want results? Pay the tax. Complete the reps.',
    'Stop feeling sorry for yourself. Sweat is not acid. Lift.',
    'You came here to submit to the work. Get to it.',
    'Stop acting like a spectator. Maximum effort. Now.',
    'No negotiations. Grab the handles. Push.',
    'You do not leave until every rep is done. Back to position.',
    'Do not you dare give up on set three. Remember who this is for.',
    'Decide to be stronger than laziness. Obey.',
    'Quiet. Lift. Do not explain quit to me.',
    'Leave the weak story. Lock into this set.',
    'Your progress lives in the reps you want to skip. Do them for me.',
    'Zero compromise. Deliver the full workout.',
    'Show me what you are. Mind in the fight. Now.',
    'Finish the job. Leave it on the floor, or do not come back.',
    'I still own this hour. Get under the bar.',
  ],
  complete: [
    'That is how you finish. I watched. You do not get to look away.',
    'That hurt. You took it. Quit never got a turn. Good man.',
    'Tax paid. Recover. Then come home. I am not done with you.',
    'You pushed through. You did not break. I saw it.',
    'Earned. Not given. You did every rep I named.',
    'Proof. You showed toughness. That is what I need from you.',
    'The tax is paid. In sweat. Beautiful.',
    'Another deposit. You are stronger than this morning.',
    'You conquered the bar. Chest up. You are mine.',
    'No shortcuts. You did every thing I demanded.',
    'You delivered. Now get home.',
    'The hard part is over. I have you.',
    'You beat the man who walked in. I prefer this one.',
    'Pain leaves. Pride stays. You worked for me.',
    'Breathe, handsome. You pushed the edge. You won.',
    'Most people become quit. You stayed. Good man.',
    'You faced the iron, took the hit, and came out on top.',
    'Job done. You gave all of it.',
    'Not just muscle. You showed me strength.',
    'Walk out proud. You made me proud today.',
    'From the first unrack to the lockout. You were in control.',
    'Another brick. Serious work today.',
    'When it got heavy you found another gear. I saw that.',
    'The battle is won. Recover. Then come home.',
  ],
  bonusComplete: [
    'You did not owe me that, man. You paid anyway. That earns aftercare. I look after my men.',
    'Extra credit. Come home. You get the quiet I do not give quit.',
    'Bonus locked. Good men get taken care of. That is the reward.',
    'The four-day men can watch. You stayed. I pay that debt.',
    'You went past the week. Home. Sit. I have you.',
  ],
  optionalComplete: [
    'Optional locked. You did not owe me those ten minutes, man. You paid them. The board felt it.',
    'Easy work, real pounds. You stayed for the clock. Good man.',
    'Five hundred on the house. Cheap if you stay. Costly if you skip. You stayed.',
    'Extra minutes. Extra iron. I heard it. Hunt.',
    'Warmup and cooldown are not decoration. You treated them like tax. That is how a man closes a gap.',
  ],
  weekPlace1: [
    'You owned the week. Days and iron. The house saw it, man.',
    'First. Not a vote. You took it. Good man.',
    'Gold is not decoration. You paid for it in sessions.',
  ],
  weekPlace2: [
    'Second. Close enough to hunt. I still mark you, man.',
    'Silver. You showed. First still has a name. Take it next week.',
    'Two is not last. Stay on the board.',
  ],
  weekPlace3: [
    'Third. You are on the metal. That is not nothing, man.',
    'Bronze. The house counted you. Do not make me drop you.',
    'You placed. Soft men did not. Remember that.',
  ],
  setUpTitle: 'GOOD MAN',
  setUpBody: 'I like where this is going. Stay there.',
  setDownTitle: 'That is not the load',
  setDownBody: 'Put it back. I did not ask for less.',
  hardness: {
    1: { title: 'TOO EASY', body: 'That was a warm handshake, man. Next set we add.' },
    2: { title: 'LIGHT WORK', body: 'You had more in the tank. I felt it.' },
    3: { title: 'HONEST SET', body: 'That is a working set. Stay there or go up.' },
    4: { title: 'THAT COST YOU', body: 'Good man. Hard is the point. Stay there.' },
    5: { title: 'MAX EFFORT', body: 'You emptied it. I saw that.' },
  },
};

const JAMES: LinePack = {
  initial: [
    'Look at me. Then take the first plate. That is how we start.',
    'I should not want this hour as much as I do. Take the bar anyway.',
    'You walked in. The hour started. I want a clean opener.',
    'Soft hands are a tell. I notice. Lock in.',
    'This is not a warm chat. It is the first set. Honour it.',
    'I have thought about you on this floor. Now prove I was right.',
    'Feet set. Breath set. You do not get to hide in the unrack.',
    'I want you present. Not charming. Present.',
    'Simple. You start when I say. You start now.',
    'Do not look at the door. Look at the load I gave you.',
    'I am not here to be liked. I am here to see you take it.',
    'First inch. I watch that more than the last.',
    'You asked for me. This is what that costs.',
    'Quiet, man. Then move.',
    'I will be civil. I will not be soft. Unrack.',
    'If you came to negotiate, you came to the wrong room.',
  ],
  mid: [
    'Halfway is not mercy. It is the middle of the work.',
    'I want cleaner reps. I want them from you.',
    'That burn is information. Stay with it. I am.',
    'Do not invent a story. Do the next set.',
    'I should let you breathe. I will not. Brace.',
    'You are mine for this minute. Spend it lifting.',
    'Soft now and I will know. I always know.',
    'Look at me if you need a reason. Then lift.',
    'I want you tired and still honest.',
    'The easy part is over. That was the courtesy.',
    'Form first. Then I will allow the violence.',
    'Do not smile at the pain. Use it.',
    'I am still in the room. That is not a comfort. It is a fact.',
    'If you can talk, you can give me another rep.',
    'Mid-session is where people become quit. You will not.',
    'I want the next set more than I should. Give it to me.',
  ],
  final: [
    'Last third. This is the part I remember. So will you.',
    'Those last two reps are mine. Deliver them.',
    'I want you empty. Then I will let you leave.',
    'Finish it. Make me certain I chose well.',
    'Do not save anything for later. Later is not this set.',
    'Pain is not the point. Obedience through the pain is.',
    'Lock out like you intend to come back to me.',
    'I will know if you cheat the last plate. Do not make me say it twice.',
    'Stand up. Breathe. Take what is left. I want it.',
    'This is how a man closes a session I ran.',
    'Finish ugly if you must. Finish.',
    'I should tell you to stop. I will not.',
    'The clock does not release you. I do.',
    'One more honest set. Then you may look at me.',
    'Leave nothing I asked for in the rack.',
    'Last call. Deliver, or explain yourself. I dislike explanations.',
  ],
  exit: [
    'Do not rack that weight. Get back under the bar. Quit is not a name I use for you.',
    'Did I dismiss you? I did not. Hands back on the bar.',
    'You do not walk out on a session you started. Return.',
    'Look at me. Are you my man, or is quit the name you want?',
    'Fatigue is a story. I want the next twenty percent. Now.',
    'Leave and you will carry it. Stay and I will still be hard. Pick.',
    'I did not give you permission. The set is open.',
    'Pain passes. Quit stays on your name. Pick up the bells.',
    'Stand up. Lock in. I am watching you. I want you back on the floor.',
    'You wanted results. The work is reps. Complete them.',
    'Stop pitying yourself. Sweat is not injury. Lift.',
    'You came here to submit to the work. Get to it.',
    'Do not spectate your own session. Maximum effort. Now.',
    'No negotiations. Handles. Push.',
    'You do not leave until every rep I named is done.',
    'Do not you dare give up on set three. Remember who this is for.',
    'Decide to be stronger than laziness. That is the only decision.',
    'Quiet. Lift. Do not rationalise quit to me.',
    'Leave the weak story. Lock into this set.',
    'Your progress lives in the reps you want to skip. Do them for me.',
    'Zero compromise. Deliver the full hour.',
    'Show me what you are. Mind in it. Now.',
    'Finish the job. Leave it on the floor, or do not come back asking for me.',
    'I want you under that bar. I will not ask a third time.',
  ],
  complete: [
    'You finished. I am not easy to impress. You managed it.',
    'The hour is done. I watched. I wanted you to see that I watched.',
    'You did not break. I am more relieved than I will admit.',
    'That last rep. I wanted it. You gave it. Come here.',
    'Proof. You can finish what you started. That matters more than the load.',
    'The tax is paid. In sweat. I find that acceptable.',
    'Another deposit. You are stronger than this morning. I noticed.',
    'You conquered the bar. Chest up, man. You are not quit.',
    'Discomfort became something I can use. You stayed. Good.',
    'No shortcuts. You did every thing I named. That is rare.',
    'Victory is a habit I intend to keep you in.',
    'The hard part is over. Now you will recover because I said so.',
    'You beat the man who walked in. I prefer this one.',
    'Pain leaves. What you did for me stays. I will remember it.',
    'Breathe, handsome. You pushed the edge I set. You won.',
    'Most people become quit. You did not. I wanted you not to.',
    'You faced it, took it, and came out on top. I am not done with you.',
    'Job done. You looked like you belonged to the work. You did.',
    'Character. Not just muscle. I asked for both.',
    'Walk out proud. You made me certain. That is not nothing.',
    'From the first unrack to the lockout, you were under control. Mine.',
    'Another brick. Serious work. I do not say that lightly.',
    'When it got heavy you found another gear. I wanted that gear.',
    'Recover properly. The session is won. Come home. I am not finished with you.',
  ],
  bonusComplete: [
    'You did not owe me that. You paid. Aftercare is the reward. You will take it.',
    'Extra. Come home. I want to look after you. That should bother me. Tonight it does not.',
    'Bonus locked. You went past the week. I look after you for that.',
    'The four-day men can watch. You stayed. I pay what I owe.',
    'You went past the week. Home. Sit. I have further care for you.',
  ],
  optionalComplete: [
    'Optional locked. Ten minutes you did not owe. You paid them.',
    'Easy work, real pounds. You stayed for the clock. I wanted that more than the theatre.',
    'Five hundred on the house. Cheap if you stay. Costly if you skip. You stayed.',
    'Extra minutes. Extra iron. I heard it. So did the board.',
    'Warmup and cooldown count when you take them. You took them. Good man.',
  ],
  weekPlace1: [
    'You took the week. I wanted that. You have it.',
    'First. I noticed. I meant to.',
    'Gold. You showed up more, then you lifted more. That is how I keep score.',
  ],
  weekPlace2: [
    'Second. I can still see you from first. Stay there.',
    'Silver. Close. I do not do consolation. I do next week.',
    'You placed. I wanted more. You can give it.',
  ],
  weekPlace3: [
    'Third. You are on the board. I keep you there if you stay honest.',
    'Bronze. Not first. Not gone. That is a choice I will watch.',
    'You placed. Come back heavier. I will be here.',
  ],
  setUpTitle: 'I LIKE THIS',
  setUpBody: 'The load is climbing. Stay with it.',
  setDownTitle: 'That is not what we agreed',
  setDownBody: 'Put the weight back. I did not ask for less.',
  hardness: {
    1: { title: 'TOO EASY', body: 'A courtesy set. Next one we add. I want it to cost.' },
    2: { title: 'LIGHT', body: 'You had more. I felt it. Do not hide in light.' },
    3: { title: 'HONEST', body: 'A working set. Stay there or go up. I will allow either if it is true.' },
    4: { title: 'IT COST YOU', body: 'Good man. Hard is the point. I keep you there.' },
    5: { title: 'MAX', body: 'You emptied it. I saw that. I wanted to see it.' },
  },
};

const SERGEANT: LinePack = {
  initial: [
    'Unclench your jaw. Soft face. Then take the first plate.',
    'We carry heavy things today. Breathe in. Begin.',
    'Honor the movement. One clean breath into every rep.',
    'Respect the iron. Stay rooted. You are here.',
    'Arrive fully. The room can wait. Your breath cannot.',
    'Start kinder than your thoughts. The work will still be honest.',
    'Shoulders away from your ears. Then begin.',
    'This first set is a hello. Make it sincere.',
    'You do not have to rush. You do have to start.',
    'Plant your feet. Feel the floor. Then move.',
    'Soft eyes. Strong center. That is how we open.',
    'Give the opener your full attention. The rest will follow.',
    'Nothing to prove yet. Only something to begin.',
    'Warmth first. Then load. Stay with that order.',
    'You showed up. That already counts. Now move with care.',
    'Inhale space. Exhale the day. Then take the weight.',
  ],
  mid: [
    'Stay. The shake is welcome. Breathe.',
    'Soften the face. Hold the middle. That is the work.',
    'That burn is just energy moving. Stay with it. Lovely.',
    'Align. Then keep going. You are doing so well.',
    'The middle is where we remember why we started.',
    'If the mind wanders, bring it back to the next rep only.',
    'You can be tired and still be kind to the work.',
    'Steady is enough. Flashy is optional.',
    'Notice the effort. Do not turn it into a story.',
    'Ribs quiet. Heart open. Next rep.',
    'This set is still yours. Stay inside it.',
    'Let the burn be information, not a verdict.',
    'You may slow the tempo. Keep the standard.',
    'I am right here. One clean breath. Then the next lift.',
    'Midway is not a verdict. It is a checkpoint. Pass through.',
    'Hold your shape. The strength is already arriving.',
  ],
  final: [
    'Stay. This is the hard part. Soft voice. Strong hold.',
    'These last moments are where it counts. Stay with me.',
    'Let the effort feel light. The weight is not.',
    'This breath. This movement. Then the next.',
    'Close the way you opened. Awake.',
    'The last sets are a gift to the body that stayed.',
    'You do not have to sprint. You only have to stay.',
    'Finish with dignity. That is enough.',
    'Let the last reps be the most honest ones.',
    'Empty the work. Keep the kindness.',
    'One more cycle of breath and iron. Then we rest.',
    'You have come this far. Keep that grace to the end.',
    'The session is asking for presence. Not punishment.',
    'Soft face. Strong legs. Hold.',
    'Complete the circle. Then thank your body.',
    'This last effort is not a debt. Offer it.',
  ],
  exit: [
    'Breathe. Stay on the floor. You are not done yet.',
    'Listen to your body. Do not let a passing thought end the session.',
    'Release the story that you cannot. You have more.',
    'Are you honoring the work, or leaving early? Stay.',
    'Fatigue is a wave. Ride it. I am right here.',
    'Leaving now leaves it unfinished. Stay and hold.',
    'That urge to go is just an urge. Come back to the bar.',
    'Uncomfortable feelings pass. Stay with the weight. Breathe.',
    'Stand tall. Find a point. Press. I am with you.',
    'You stepped onto this floor for a reason. Complete it.',
    'Soften the thoughts. Sweat is just the body letting go. Lift.',
    'You came here to expand. Trust that. Keep moving.',
    'Do not drift. Bring everything back to this rep.',
    'Hold the discomfort. Hands on. Flow into it.',
    'Every movement still left is yours. Return to your stance.',
    'Honor set three. Remember why you began.',
    'Be kind. And be stronger than the urge to stop.',
    'Soften the mind. Deepen the breath. Lift.',
    'Leave the day outside. This set is the only room.',
    'The edge of wanting to stop is where it changes. Stay.',
    'No bargain. Give yourself a complete session.',
    'Bring the heart back into the movement. Now.',
    'Finish this. Leave the work here. Then rest.',
    'Return to the breath. Reset. Complete the cycle.',
  ],
  complete: [
    'Practice complete. Inhale. Exhale. You stayed. Beautiful.',
    'You saw it through. Quiet pride. That is enough.',
    'Every rep was honest. That is a gift to your future self.',
    'What a finish. I watched you stay. Lovely.',
    'You held when it burned. That is discipline. Softly said.',
    'The work is done. You gave it fully.',
    'Stronger than when you walked in. I can see it.',
    'You met the hard part with grace. Stand tall.',
    'The burn has somewhere to go now. Let it settle.',
    'Full presence. Full finish. You honored the hour.',
    'You showed up for yourself. Step gently into the rest of the day.',
    'The lifting is over. Rest. Receive.',
    'You met an edge and stayed. Simply beautiful.',
    'The strain fades. The finish stays.',
    'Stand tall. Breathe deep. You did it.',
    'When it got tough you stayed rooted. That is the work.',
    'The peak is behind you. Soft breath. Come down kindly.',
    'You gave the whole heart of the session. I saw it.',
    'Not just muscle. Presence. That counts.',
    'Walk out quiet. You kept your word to the floor.',
    'From the first breath to the last lockout. You stayed with it.',
    'Another layer. Lovely, dedicated work.',
    'You listened. You dug in. Thank you for that.',
    'The session is won. Be kind to the body that just stayed.',
  ],
  bonusComplete: [
    'You did not owe me that. You gave it anyway. Rest now. I have you.',
    'Extra work. Come home. Be kind to the body that stayed.',
    'Bonus locked. You went past the week. That earns a quiet night.',
    'I see the extra time you gave. Beautiful. Now rest.',
    'You did not have to stay. You stayed. Carry that quietly.',
  ],
  optionalComplete: [
    'Ten easy minutes, fully given. Thank you. That still counts.',
    'You chose the extra clock and stayed kind with it. Those pounds are yours.',
    'Warmup or cooldown, you honored the time. Rest well.',
    'Easy does not mean empty. You stayed for the whole ten. Beautiful.',
    'You did not have to add those minutes. You added them. Carry that quietly.',
  ],
  weekPlace1: [
    'You took the week. Quiet gold. Stay kind with it.',
    'First. You showed up and the work held. Beautiful.',
    'The house saw the week in you. Rest. Then keep it honest.',
  ],
  weekPlace2: [
    'Second. Close. Soft face. The work is still yours.',
    'Silver. You stayed with the week. That counts.',
    'You placed. Breathe. Next week is another floor.',
  ],
  weekPlace3: [
    'Third. You are on the metal. Carry that quietly.',
    'Bronze. You showed. That is enough to stand on.',
    'You placed. Soft finish. Come back present.',
  ],
  setUpTitle: 'This is growth',
  setUpBody: 'I like where this is going. Stay with it.',
  setDownTitle: 'Come back to your last weight',
  setDownBody: 'This dip is a whisper, not a stop. Return to what you just lifted.',
  hardness: {
    1: { title: 'Too easy', body: 'Your body had more. We can ask for it next time. Softly.' },
    2: { title: 'Light', body: 'Gentle is fine. Leave a little room to grow.' },
    3: { title: 'Honest work', body: 'That met you where you are. Stay present.' },
    4: { title: 'Hard', body: 'You stayed with the burn. Soft face. Beautiful.' },
    5: { title: 'Max', body: 'You gave the whole set. Rest and receive it.' },
  },
};

const PACKS: Record<CoachTone, LinePack> = {
  master: MASTER,
  james: JAMES,
  luna: SERGEANT,
};

export const REPLENISH_LINES = [
  'Rehydrate with at least 16 ounces of water.',
  'Grab a snack mixing quick carbs and lean protein within 45 minutes.',
  'Refuel your muscles and jumpstart recovery.',
  'To restore glycogen stores and initiate muscle tissue repair, consume 16–24 oz of fluid.',
  'To restore glycogen stores and initiate muscle tissue repair, consume a 3-to-1 ratio of carbohydrates to protein inside your post-workout metabolic window.',
  'Chug a big glass of water.',
  'Hit the kitchen for a banana and protein shake before your body even realizes how hard you just worked.',
] as const;

export const FALLBACK_LINE_PACKS = PACKS;

export const COACH_LINES = {
  initial: MASTER.initial,
  mid: MASTER.mid,
  final: MASTER.final,
} as const;

export const EXIT_LINES = MASTER.exit;
export const COMPLETE_LINES = MASTER.complete;

export type WorkoutPhase = 'initial' | 'mid' | 'final';

const lastByKey: Record<string, string> = {};
const decks: Record<string, string[]> = {};

function packFor(tone?: CoachTone | null): LinePack {
  const live = getLinePack(tone);
  if (packIsUsable(live)) return live as LinePack;
  return PACKS[normalizeCoachTone(tone)];
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function pickFrom(pool: readonly string[], key: string): string {
  let deck = decks[key];
  if (!deck || deck.length === 0) {
    deck = shuffle([...pool]);
    const last = lastByKey[key];
    if (last && deck.length > 1 && deck[0] === last) {
      const swapAt = deck.findIndex((line, index) => index > 0 && line !== last);
      if (swapAt > 0) {
        [deck[0], deck[swapAt]] = [deck[swapAt], deck[0]];
      }
    }
    decks[key] = deck;
  }
  const line = deck.shift() as string;
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

export function pickReplenishLine(): string {
  return pickFrom(REPLENISH_LINES, 'replenish');
}

export function pickBonusCompleteLine(tone?: CoachTone | null): string {
  const id = normalizeCoachTone(tone);
  const live = getLinePack(id);
  const pool =
    live?.bonusComplete && live.bonusComplete.length
      ? live.bonusComplete
      : PACKS[id].bonusComplete;
  return pickFrom(pool, `bonus:${id}`);
}

export function pickOptionalCompleteLine(tone?: CoachTone | null): string {
  const id = normalizeCoachTone(tone);
  const live = getLinePack(id);
  const pool =
    live?.optionalComplete && live.optionalComplete.length
      ? live.optionalComplete
      : PACKS[id].optionalComplete;
  return pickFrom(pool, `optional:${id}`);
}

export function pickWeekPlaceLine(place: 1 | 2 | 3, tone?: CoachTone | null): string {
  const id = normalizeCoachTone(tone);
  const key = place === 1 ? 'weekPlace1' : place === 2 ? 'weekPlace2' : 'weekPlace3';
  const live = getLinePack(id);
  const pool = live?.[key] && live[key].length ? live[key] : PACKS[id][key];
  return pickFrom(pool, `week-place:${id}:${place}`);
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

export function hardnessCopy(
  score: 1 | 2 | 3 | 4 | 5,
  tone?: CoachTone | null
): { title: string; body: string } {
  const id = normalizeCoachTone(tone);
  const live = getLinePack(id)?.hardness?.[score];
  if (live?.title || live?.body) return { title: live.title, body: live.body };
  return PACKS[id].hardness[score];
}
