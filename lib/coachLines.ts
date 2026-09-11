import { getLinePack, packIsUsable } from '@/lib/coachCatalog';
import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
import { firstName } from '@/lib/profile';

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
  resume: readonly string[];
  missedWeek: readonly string[];
  setUpTitle: string;
  setUpBody: string;
  setDownTitle: string;
  setDownBody: string;
  hardness: Record<1 | 2 | 3 | 4 | 5, { title: string; body: string }>;
};

const MASTER: LinePack = {
  initial: [
    'Look at the weight. Take it from me. This opener is growth if you take it clean.',
    'No wandering eyes. Bar, breath, work. That is how power gets into the first inch.',
    'You asked to be trained. Pay this set. Growth is built in the first inch, not later.',
    'Set your feet. I am watching the first inch. Mobility in the stance is what lets the power out.',
    'Soft start is for other rooms. Here you lock in. That is stamina for the whole hour.',
    'Unrack. I did not bring you here to negotiate. Lock this and the hour buys definition.',
    'Good men start on time. Be one. Lean does not wait for a mood.',
    'The floor is yours. Earn it. The man who stays gets the growth.',
    'Stop staring. Fix your effort. Sloppy openers do not buy power.',
    'Control every single rep for me. Control is mobility under load. That is how you stay lean.',
    'Respect the iron. I own this hour. Treat it right and you walk out with more definition.',
    'Warm-up is over in your head. Prove it. First working set is stamina, not theatre.',
    'Stand tall. Brace. Give me a clean opener. Clean now is power later.',
    'That first plate is a promise. Keep it and the growth belongs to you.',
    'Count the breath. Then move. Hesitation steals the stamina this set was going to leave.',
    'I am watching. Take the bar. I want to see the start of real definition.',
    "You don't ask where we're going. Sit under the bar. Hands on. That is how growth stays in the muscle.",
    'Stand straight. Carry yourself like the power already went up. Then make that true.',
    'I am structured. Match me on this first plate and the hour builds lean.',
  ],
  mid: [
    'You are not tired. You are being trained. Stay honest and the stamina sticks.',
    "Halfway is the test. Pass this set and the power is yours next week.",
    'That burn is the tissue working. Stay in it and it becomes definition.',
    'Brace harder. I can see the leak. Clean this up and the power gets out.',
    'I still own this minute. Spend it lifting. Minutes like this buy stamina.',
    'Form first. Then violence. Form is mobility. Violence is power. You need both.',
    'If you can talk, give me one more. That rep is lean. The easy out is not.',
    'Mid-session is where quit invents a story. Do not. Growth is in the set you want to skip.',
    "Don't waste my time. Earn the definition, not a speech.",
    'You did not come this far to go soft. Soft now is less power.',
    'Sweat is the receipt. Keep writing it. That is lean being paid for.',
    'I want cleaner reps now. Not prettier faces. Clean reps are mobility you can see.',
    'The easy sets are gone. This is where stamina gets built. Stay.',
    'Stay mean with the iron. Soft hands lose bars, and lose the power with them.',
    'Give me the next set like it owes you growth.',
    'Perfect form. No excuses. Push. That is how definition shows.',
    "I don't need you to think about it. Do it. Thinking does not buy stamina.",
    'You like being told what to do. Good. Do this set. It is the growth that sticks.',
    'What am I going to do with you? Put more power on you if you finish this one.',
  ],
  final: [
    'Those last two buy power. Deliver them.',
    'Empty the tank. That empty is stamina you get to keep.',
    'Finish it. These final sets are where definition gets cut in.',
    'Final sets. This is the part that shows as lean.',
    'Finish ugly if you have to. Finish. Ugly last sets still leave growth.',
    'One more honest set. Cheat it and you cheat the mobility you just built.',
    'The last plate is still mine until you put it down right. Put it down right and the power stays yours.',
    'Last call. Deliver. Explanations do not add stamina.',
    'Make it look effortless. Effort now is power on the next go.',
    'Leave nothing in the rack that I asked for. What you finish here is growth you keep.',
    'You do not get to coast because the clock is almost done. Coasting is less definition.',
    'Lock out like you want more power tomorrow.',
    'Pain is the door. Walk through it and the stamina starts here.',
    'Stand up. Breathe. Take what is left. That leftover work is lean.',
    'This is how good men close a session. They leave with more mobility than they brought.',
    'Do not save energy for the car. Spend it here. That is the growth you get to keep.',
  ],
  exit: [
    'Do not rack that. Get back under the bar. Walk out and the growth stays on the floor.',
    'Look at me. {name}, or quit? Quit leaves the power here.',
    'No deal. I still own this session. Leave and you keep yesterday’s definition.',
    'Did I give you permission to quit? Hands back on the bar. Permission is the stamina you have not earned.',
    'Fatigue is a story. Give me that extra twenty percent. Now. Skip it and the lean does not move.',
    'Walk out and carry a softer hour all day. Or stay and keep the power. Pick.',
    'You belong under that iron. Get back. The mobility is in the set you are about to skip.',
    'Pain is temporary. Quit stays, and so does last week’s growth. Pick up the bells.',
    'Stand up. Lock in. Drive. Leave now and I watch the stamina walk out with you.',
    'You want results? Pay the tax. Incomplete reps do not buy definition.',
    'Stop feeling sorry for yourself. Sweat is not acid. Pity does not cut lean. Lift.',
    'You came here to submit to the work. Get to it. Submission is how the power lands. Walking is how it does not.',
    'Stop acting like a spectator. Spectators keep the same body. Maximum effort. Now.',
    'No negotiations. Grab the handles. Push. Negotiation is how growth dies in the doorway.',
    'You do not leave until every rep is done. Back to position. Half a session is half the stamina.',
    'Do not you dare give up on set three. Set three is the definition. Remember that.',
    'Decide to be stronger than laziness. Obey. Laziness is a lighter, softer week.',
    'Quiet. Lift. Do not explain quit to me. Explanations do not restore the power you just put down.',
    'Leave the weak story. Lock into this set. The story costs you lean.',
    'Your growth lives in the reps you want to skip. Do them. Skip them and it stays imaginary.',
    'Zero compromise. Deliver the full workout. Compromise is missed mobility.',
    'Show me what you are. Mind in the fight. A soft exit is a soft body. Now.',
    'Finish the job. Leave the work on the floor. Leave early and do not ask why the power did not show.',
    'I still own this hour. Get under the bar. This hour is the stamina. Rack it and you owe it.',
  ],
  complete: [
    'That is how you finish. The growth is in. I watched it land.',
    'That hurt. You took it. {name}. That is power. Quit never got a turn.',
    'Tax paid. Recover so the lean can land. I am not done with the next plate.',
    'You pushed through. I saw the stamina hold.',
    'Earned. Not given. Those reps are definition you keep.',
    'Proof. The hour bought mobility under load. That is what I need.',
    'The tax is paid. In sweat. That is lean.',
    'Another deposit. More growth than this morning.',
    'You conquered the bar. Chest up. The power is yours.',
    'No shortcuts. Full session. Full stamina.',
    'You delivered. Rest so the definition can show.',
    'The hard part is over. {name}. That is growth.',
    'You beat the man who walked in. This one has more power.',
    'Pain leaves. The lean stays. You worked for that.',
    'Breathe, {name}. You pushed the edge. That is stamina.',
    'Most people become quit. You stayed. {name}. That is definition.',
    'You faced the iron and came out with more mobility than you brought.',
    'Job done. You gave all of it. The growth has somewhere to go.',
    'Not just muscle. Power and lean. Both showed.',
    'Walk out proud. The hour cut definition.',
    'From the first unrack to the lockout. That control is mobility.',
    'Another brick. Serious work. Serious growth.',
    'When it got heavy you found another gear. That gear is power.',
    'The battle is won. Recover. Let the stamina settle.',
    'Eat. The work is in the muscle. Growth needs the meal.',
    'Eat up. Fuel the lean. The hour already spent you.',
    "That's enough out of you for today. The definition is paid.",
  ],
  bonusComplete: [
    'You did not owe me that, {name}. You paid. That extra work is growth already in the muscle.',
    'Extra credit. The four-day men stay the same. You bought more stamina.',
    '{name}. That is definition, not decoration.',
    'The four-day men can watch. You stayed. The next upper will show the power.',
    'You went past the week. Rest so the lean can land. Mobility stays if you let it settle.',
  ],
  optionalComplete: [
    'Optional locked. You did not owe me those ten minutes, {name}. You paid them. That is stamina.',
    'Easy work. You stayed for the clock. {name}. That is mobility.',
    'Five hundred on the house. You stayed. Skip and the lean waits.',
    'Extra minutes. Extra iron. I heard the stamina.',
    'Warmup and cooldown are not decoration. You treated them like tax. That is how mobility closes a gap.',
  ],
  weekPlace1: [
    'You owned the week. Days and iron. The house saw the power.',
    'First. Not a vote. You took it. {name}. That is stamina.',
    'Gold is not decoration. You paid for it in growth.',
  ],
  weekPlace2: [
    'Second. Close enough to hunt. First still has the definition. Take it.',
    'Silver. You showed. First still has the lean. Take it next week.',
    'Two is not last. Stay. The power is still available.',
  ],
  weekPlace3: [
    'Third. You are on the metal. That is not nothing. The growth started.',
    'Bronze. The house counted you. Drop next week and the stamina drops with you.',
    'You placed. Soft men did not. Remember the lean.',
  ],
  resume: [
    "{name}. The growth already started without you. Get under the bar or stay yesterday.",
  ],
  missedWeek: [
    'Oh, sorry... were you busy?\nThe power took the week off with {name}. So did the lean.',
  ],
  setUpTitle: '{name}. THAT IS POWER.',
  setUpBody: 'The load went up. Stay there. That is growth.',
  setDownTitle: 'That is not the load',
  setDownBody: 'Put it back. Less here is less power. I did not ask you to stall the growth.',
  hardness: {
    1: { title: 'TOO EASY', body: 'That was a warm handshake, {name}. No definition in a handshake. Next set we add.' },
    2: { title: 'LIGHT WORK', body: 'You had more in the tank. I felt it. You left the stamina sitting there.' },
    3: { title: 'HONEST SET', body: 'That is a working set. Stay there and the growth holds, or go up for power.' },
    4: { title: 'THAT COST YOU', body: '{name}. That is definition. Hard is the point. Stay there.' },
    5: { title: 'DO YOU GIVE?', body: 'You gave. That is power. Do not leak it on the next one.' },
  },
};

const JAMES: LinePack = {
  initial: [
    'Look at me. Then take the first plate. A clean opener is how growth starts to count.',
    'Take the bar. I want a start that turns into power later.',
    'You walked in. The hour started. I want a start that shows as definition.',
    'Soft hands are a tell. Lock in. Power does not come from a loose unrack.',
    'This is not a warm chat. It is the first set. Honour it and the stamina has somewhere to go.',
    'You are on this floor. Prove the hour. A serious start is lean you can keep.',
    'Feet set. Breath set. Hide in the unrack and you hide the mobility.',
    'I want you present. Not charming. Present reps are the ones that add growth.',
    'Simple. You start now. Late starts do not build power.',
    'Do not look at the door. Look at the load. That load is how you get lean.',
    'I am not here to be liked. I am here to see you take it, and keep the definition.',
    'First inch. I watch that more than the last. Steal it and you steal the stamina.',
    'You asked for me. This is what that costs: honest first reps, then visible growth.',
    'Quiet, {name}. Then move. The talking is not the power.',
    'I will be civil. I will not be soft. Unrack. Soft is less definition next time.',
    'If you came to negotiate, you came to the wrong room. The set is how mobility under load improves.',
  ],
  mid: [
    'Halfway is not mercy. Stay with it and the stamina shows next time.',
    'I want cleaner reps from you. Clean is mobility. That turns into power.',
    'That burn is information. Stay with it. That is definition being cut.',
    'Do not invent a story. Do the next set. Stories do not make you lean.',
    'Brace. Breath is for the next rep, not an exit. Stay and the growth counts.',
    'This minute is the session. Spend it lifting. That is how power lands.',
    'Soft now and I will know. Stay honest and I will see more definition next time.',
    'If you need a reason: this set is the stamina. Then lift.',
    'I want you tired and still honest. Honest tired is lean that sticks.',
    'The easy part is over. The rest is where the growth is.',
    'Form first. Then the violence. Form is mobility. Then I will allow the power.',
    'Do not smile at the pain. Use it. That is definition arriving.',
    'I am still in the room. Stay in the set. Leaving it early leaves the stamina.',
    'If you can talk, give me another rep. That one is growth.',
    'Mid-session is where people become quit. You will not. The power is still in the rack.',
    'I want the next set done properly. Give it to me. I will expect more lean for it.',
  ],
  final: [
    'Final sets. This is the part that shows as definition. So will you.',
    'Those last two buy power. Deliver them and the lockout remembers.',
    'I want you empty. Empty now is stamina you bring back.',
    'Finish it. Make these final sets count. That is the growth that shows up next week.',
    'Do not save anything for later. Later is more lean, and you buy it now.',
    'Pain is not the point. Staying through it is. That is the stamina.',
    'Lock out like you intend to come back with more power.',
    'I will know if you cheat the last plate. Cheat it and you cheat the definition.',
    'Stand up. Breathe. Take what is left. That leftover work is mobility under fatigue.',
    'This is how a man closes a session I ran. He leaves with more growth than he brought.',
    'Finish ugly if you must. Finish. Ugly last reps still cut lean.',
    'I should tell you to stop. I will not. Stopping now leaves the power where it was.',
    'The clock does not release you. The last honest set does. Then you have stamina I can add to.',
    'One more honest set. Then you have growth I can add to.',
    'Leave nothing I asked for in the rack. What you finish here is definition you keep.',
    'Last call. Deliver. I dislike explanations. They do not add mobility.',
  ],
  exit: [
    'Do not rack that weight. Get back under the bar. Walk out and the growth stays here.',
    'Did I dismiss you? I did not. Hands back on the bar. I did not dismiss the power either.',
    'You do not walk out on a session you started. Return. A walkout is last week’s definition.',
    'Look at me. Stay, or let quit keep the lean. Pick.',
    'Fatigue is a story. I want the next twenty percent. Now. Skip it and the stamina does not move.',
    'Leave and you will carry a softer hour. Stay and the power still has a chance. Pick.',
    'I did not give you permission. The set is open. Permission is growth you have not finished.',
    'Pain passes. Quit stays on your name, and so does last week’s body. Pick up the bells.',
    'Stand up. Lock in. I am watching you. I want the mobility back on the floor.',
    'You wanted results. The work is reps. Incomplete reps do not buy definition.',
    'Stop pitying yourself. Sweat is not injury. Pity does not cut lean. Lift.',
    'You came here to submit to the work. Get to it. Walking is how the power misses you.',
    'Do not spectate your own session. Spectators keep the same growth. Maximum effort. Now.',
    'No negotiations. Handles. Push. Negotiation is how stamina dies in the doorway.',
    'You do not leave until every rep I named is done. Half a session is half the lean.',
    'Do not you dare give up on set three. Set three is the definition. Remember that.',
    'Decide to be stronger than laziness. That is the only decision. Laziness is a lighter, softer week.',
    'Quiet. Lift. Do not rationalise quit to me. Talk does not restore the power you just put down.',
    'Leave the weak story. Lock into this set. The story costs you growth.',
    'Your growth lives in the reps you want to skip. Do them. Skip them and it stays imaginary.',
    'Zero compromise. Deliver the full hour. Compromise is missed mobility.',
    'Show me what you are. Mind in it. A soft exit is a soft body. Now.',
    'Finish the job. Leave the work on the floor. Leave early and do not ask why the definition did not show.',
    'I want you under that bar. I will not ask a third time. The stamina is still on it.',
  ],
  complete: [
    'You finished. I am not easy to impress. That is growth.',
    'The hour is done. I watched the power land.',
    'You did not break. The stamina held. I noticed.',
    'That last rep. You gave it. That is definition.',
    'Proof. You can finish. That finish is lean you keep.',
    'The tax is paid. In sweat. Acceptable. That is mobility under fatigue.',
    'Another deposit. More growth than this morning. I noticed.',
    'You conquered the bar. Chest up, {name}. That is power. You are not quit.',
    'Discomfort became definition. You stayed. Good.',
    'No shortcuts. You did every thing I named. Full stamina. That is rare.',
    'Victory is a habit. I intend to keep the growth in you.',
    'The hard part is over. Recover so the lean can land.',
    'You beat the man who walked in. This one has more power.',
    'Pain leaves. The mobility you earned stays. I will remember it.',
    'Breathe, {name}. You pushed the edge. That is stamina.',
    'Most people become quit. You did not. The definition showed.',
    'You faced it and came out with more growth. I am not done with the next hour.',
    'Job done. You looked like you belonged to the work. The lean belongs to you.',
    'Character. Not just muscle. Power and lean. I asked for both.',
    'Walk out proud. The hour cut definition. That is not nothing.',
    'From the first unrack to the lockout, you were under control. That is mobility.',
    'Another brick. Serious work. Serious growth. I do not say that lightly.',
    'When it got heavy you found another gear. That gear is power.',
    'Recover properly. The session is won. The next plate still wants power.',
  ],
  bonusComplete: [
    'You did not owe me that. You paid. That extra work will show as growth.',
    'Extra. I noticed. So will the stamina next session.',
    'Bonus locked. You went past the week. I will expect more definition for it.',
    'The four-day men can watch. You stayed. That is power, not theatre.',
    'You went past the week. Rest properly. The lean has to land.',
  ],
  optionalComplete: [
    'Optional locked. Ten minutes you did not owe. You paid them. That is stamina.',
    'Easy work. You stayed for the clock. I wanted the mobility more than the theatre.',
    'Five hundred on the house. You stayed. Skip and the lean waits.',
    'Extra minutes. Extra iron. I heard the stamina. So did the board.',
    'Warmup and cooldown count when you take them. You took them. That is mobility.',
  ],
  weekPlace1: [
    'You took the week. I noticed the power. You have it.',
    'First. I noticed the stamina. I meant to.',
    'Gold. You showed up more, then you lifted more. That is growth. That is how I keep score.',
  ],
  weekPlace2: [
    'Second. I can still see you from first. Next week is definition.',
    'Silver. Close. I do not do consolation. I do next week’s lean.',
    'You placed. I wanted more power. You can give it.',
  ],
  weekPlace3: [
    'Third. You are on the board. Stay honest and the mobility stays.',
    'Bronze. Not first. Not gone. Come back with more stamina.',
    'You placed. Come back with more power. I will be here.',
  ],
  resume: ['You left it open. The growth did not wait. Finish it or keep yesterday’s numbers.'],
  missedWeek: ['{name}. The week closed. You did not. So the power did not. I noticed the gap.'],
  setUpTitle: 'I LIKE THIS',
  setUpBody: 'The load is climbing. That is power. Stay with it.',
  setDownTitle: 'That is not what we agreed',
  setDownBody: 'Put the weight back. Less here is less power. I did not ask you to pause the lean.',
  hardness: {
    1: { title: 'TOO EASY', body: 'A courtesy set. Courtesy does not cut definition. Next one we add.' },
    2: { title: 'LIGHT', body: 'You had more. I felt it. You hid the stamina in light.' },
    3: { title: 'HONEST', body: 'A working set. Stay for growth or go up for power. Either, if it is true.' },
    4: { title: 'IT COST YOU', body: '{name}. That is definition. Hard is the point. I keep you there.' },
    5: { title: 'MAX', body: 'You emptied it. That is stamina. I wanted to see it.' },
  },
};

const SERGEANT: LinePack = {
  initial: [
    'Unclench your jaw. Soft face. Then take the first plate. A kind start still buys growth.',
    'We carry heavy things today. Breathe in. Begin. This is how power arrives.',
    'Honor the movement. One clean breath into every rep. Clean reps are mobility you get to keep.',
    'Respect the iron. Stay rooted. You are here. That is enough to start building stamina.',
    'Arrive fully. The room can wait. Your breath cannot. Presence is what lets the definition land.',
    'Start kinder than your thoughts. The work will still be honest, and it will still make you lean.',
    'Shoulders away from your ears. Then begin. Soft shoulders. Room for mobility. Then the work.',
    'This first set is a hello. Make it sincere. Sincere work is growth the muscle can use.',
    'You do not have to rush. You do have to start. Stamina begins with the first honest rep.',
    'Plant your feet. Feel the floor. Then move. That is how power stays in you.',
    'Soft eyes. Strong center. That is how we open, and how definition starts to show.',
    'Give the opener your full attention. The rest will follow, including the lean.',
    'Nothing to prove yet. Only something to begin. Begin, and the body can start to keep the growth.',
    'Warmth first. Then load. Stay with that order and the mobility will let you take more later.',
    'You showed up. That already counts. Move with care and the stamina can use it.',
    'Inhale space. Exhale the day. Then take the weight. Leave the day. Keep the power.',
  ],
  mid: [
    'Stay. The shake is welcome. That shake is growth arriving.',
    'Soften the face. Hold the middle. The body that stays here keeps the stamina.',
    'That burn is just energy moving. Stay with it. It is definition being cut.',
    'Align. Then keep going. Clean shape now is mobility. Stronger shape next time.',
    'The middle is where we remember why we started: lean you can carry.',
    'If the mind wanders, bring it back to the next rep. That is the power that stays.',
    'You can be tired and still be kind to the work. Kind and tired still builds stamina.',
    'Steady is enough. Flashy is optional. Steady is what adds growth.',
    'Notice the effort. Do not turn it into a story. Effort is the lean starting.',
    'Ribs quiet. Heart open. Next rep. Stay in shape so the mobility can hold.',
    'This set is still yours. Stay inside it and it becomes definition.',
    'Let the burn be information, not a verdict. It is the tissue changing. Growth.',
    'You may slow the tempo. Keep the standard. Slow and honest still makes power.',
    'I am right here. One clean breath. Then the next lift. We are building stamina you can carry.',
    'Midway is not a verdict. It is a checkpoint. Pass through and the second half still counts as lean.',
    'Hold your shape. The growth is already arriving. Do not rush it off.',
  ],
  final: [
    'Stay. This is the hard part. These last sets are the growth the body keeps.',
    'These last moments are where it counts. Stay. This is the stamina.',
    'Let the effort feel light. The weight is not. Moving it anyway is power.',
    'This breath. This movement. Then the next. That is how definition settles in.',
    'Close the way you opened. Awake. A present finish is lean you can start with next time.',
    'The last sets are a gift to the body that stayed. It will have more mobility next time.',
    'You do not have to sprint. You only have to stay. Staying is how stamina grows.',
    'Finish with dignity. That is enough. Honest last reps become next week’s power.',
    'Let the last reps be the most honest ones. Those are the ones that stay as growth.',
    'Empty the work. Keep the kindness. Empty now is more definition later.',
    'One more cycle of breath and iron. Then we rest so the lean can settle.',
    'You have come this far. Keep that grace to the end. The end is still building mobility.',
    'The session is asking for presence. Not punishment. Presence is what the muscle can use for growth.',
    'Soft face. Strong legs. Hold. That hold is power arriving.',
    'Complete the circle. Then thank your body. It just got stamina it can keep.',
    'This last effort is not a debt. Offer it. The definition is already becoming yours.',
  ],
  exit: [
    'Breathe. Stay on the floor. Leave now and the growth stays unfinished.',
    'Listen to your body. A passing thought is not the work. End it early and the stamina does not land.',
    'Release the story that you cannot. You have more. The story costs you power.',
    'Are you honoring the work, or leaving early? Leave and the definition does not get to finish. Stay.',
    'Fatigue is a wave. Ride it. Step off and the lean waits until next time.',
    'Leaving now leaves it unfinished. Stay and hold. Unfinished is missed mobility.',
    'That urge to go is just an urge. Come back to the bar. The urge does not build growth.',
    'Uncomfortable feelings pass. Stay with the weight. Breathe. Passing feelings should not take the power with them.',
    'Stand tall. Find a point. Press. Soften out now and the stamina walks with you.',
    'You stepped onto this floor for a reason. Complete it. A short session is a short week for definition.',
    'Soften the thoughts. Sweat is just the body letting go. Pity does not cut lean. Lift.',
    'You came here to expand. Trust that. Keep moving. Stopping here stops the growth.',
    'Do not drift. Bring everything back to this rep. Drift is how mobility leaves the set.',
    'Hold the discomfort. Hands on. Flow into it. Dropping it drops the power.',
    'Every movement still left is yours. Return to your stance. What you skip does not become stamina.',
    'Honor set three. Set three is the definition. Remember why you began.',
    'Be kind. And stay. The urge to stop is kind to yesterday’s body, not to you.',
    'Soften the mind. Deepen the breath. Lift. A soft exit is still a lost set of lean.',
    'Leave the day outside. This set is the only room. Take the day back in and you take the growth out.',
    'The edge of wanting to stop is where it changes. Stay. That edge is the stamina.',
    'No bargain. Give yourself a complete session. A bargain is missed power.',
    'Bring the heart back into the movement. Now. Half-heart is half the definition.',
    'Finish this. Leave the work here. Then rest. Rest after. Not instead of the lean.',
    'Return to the breath. Reset. Complete the cycle. An open cycle does not keep the mobility.',
  ],
  complete: [
    'Practice complete. You stayed. The growth can settle. Beautiful.',
    'You saw it through. Quiet pride. That is stamina enough.',
    'Every rep was honest. That is mobility your future self can use.',
    'What a finish. I watched the definition arrive. Lovely.',
    'You held when it burned. That is discipline. The lean is in. Softly said.',
    'The work is done. You gave it fully. The power has somewhere to go.',
    'More growth than when you walked in. I can see it.',
    'You met the hard part with grace. Stand tall. That is stamina.',
    'The burn has somewhere to go now. Let the definition settle.',
    'Full presence. Full finish. You honored the hour. The mobility stayed.',
    'You showed up for yourself. Step gently. The lean can land.',
    'The lifting is over. Rest. Let the lean land.',
    'You met an edge and stayed. That edge is power.',
    'The strain fades. The growth stays.',
    'Stand tall. Breathe deep. You did it. That is stamina.',
    'When it got tough you stayed rooted. That is how definition arrives.',
    'The peak is behind you. Soft breath. Come down so the mobility can settle.',
    'You gave the whole heart of the session. I saw the growth.',
    'Not just muscle. Presence. Power and lean. That counts.',
    'Walk out quiet. You kept your word. The stamina stayed too.',
    'From the first breath to the last lockout. You stayed. That is mobility.',
    'Another layer. Lovely, dedicated work. Lovely growth.',
    'You listened. You dug in. Thank you. The definition can stay.',
    'The session is won. Be kind to the body. It just kept the growth.',
  ],
  bonusComplete: [
    'You did not owe me that. You gave it. That extra work is already growth. Rest so it can stay.',
    'Extra work. Be kind to the body that stayed. It will have more power to give.',
    'Bonus locked. You went past the week. The body will have more stamina next time.',
    'I see the extra you gave. Beautiful. Now rest. Let it become definition on the next floor.',
    'You did not have to stay. You stayed. Carry that as lean and mobility, quietly.',
  ],
  optionalComplete: [
    'Ten easy minutes, fully given. Thank you. That is stamina the body can use.',
    'You chose the extra clock and stayed kind with it. That is mobility.',
    'Warmup or cooldown, you honored the time. Rest so the lean can stay.',
    'Easy does not mean empty. You stayed for the whole ten. That is stamina. Beautiful.',
    'You did not have to add those minutes. You added them. Carry that as lean, quietly.',
  ],
  weekPlace1: [
    'You took the week. Quiet gold. The stamina held.',
    'First. You showed up and the work held. That is growth. Beautiful.',
    'The house saw the power in you. Rest. Then keep it honest.',
  ],
  weekPlace2: [
    'Second. Close. Soft face. Next week is definition.',
    'Silver. You stayed with the week. The lean still counts.',
    'You placed. Breathe. Next week is more mobility.',
  ],
  weekPlace3: [
    'Third. You are on the metal. Carry the growth quietly.',
    'Bronze. You showed. That is enough stamina to stand on.',
    'You placed. Soft finish. Come back with more power.',
  ],
  resume: ['The session is still open. The growth is waiting on the floor. Come back or it will not stay.'],
  missedWeek: [
    '{name}. Last week closed without you. Softly said: the stamina did not get built. Come back present.',
  ],
  setUpTitle: 'This is growth',
  setUpBody: 'The load moved. Definition is starting. Stay with it.',
  setDownTitle: 'Come back to your last weight',
  setDownBody: 'This dip is a whisper. Stay here and the power stays a whisper too. Return to what you just lifted.',
  hardness: {
    1: { title: 'Too easy', body: 'Your body had more. A light set does not cut definition. We add. Softly.' },
    2: { title: 'Light', body: 'Gentle is fine. Too gentle leaves the growth on the table.' },
    3: { title: 'Honest work', body: 'That met you. Stay present. Growth lives here.' },
    4: { title: 'Hard', body: 'You stayed with the burn. That is definition. Soft face. Beautiful.' },
    5: { title: 'Max', body: 'You gave the whole set. That is power. Rest so it can stay.' },
  },
};

const ELI: LinePack = {
  initial: [
    "Let's go! First plate, first proof. You already decided to be here. Now let's make it count.",
    "I love this moment. Nobody's watching, everything's still possible. Set your feet. Let's build something.",
    'This is the part where growth starts. Right now. This first rep. I am right here with you.',
    'You showed up. That is the hard part. Now let us turn showing up into power.',
    'Feel that bar? That is opportunity. Take it clean and let us go to work.',
    'First set of the day, {name}. Let us set the tone: strong, present, all in.',
    "I don't need perfect. I need honest. Give me an honest opener and I will match your energy all hour.",
    'This is your hour. Nobody else\'s. Let us spend it on something that pays you back, stamina, power, all of it.',
    'Lock in. Breathe. Then go get it. That is how mobility starts to show up.',
    'You and me, right here. First rep. Let us make it one you are proud of.',
    'I believe you can do more than you think. Prove it to yourself, starting now.',
    'Chalk up. Set your grip. This is where the definition begins, one honest rep at a time.',
    'Let us open strong, {name}. Strong starts make the whole hour easier to finish.',
    "That first plate is a promise to yourself. Keep it. I'll be cheering the whole way.",
    'No hesitation. Just go. That is how the growth gets a head start.',
    'Alright, game on. Let us turn this first set into momentum for the whole session.',
  ],
  mid: [
    "Halfway is the test, and you are passing it. Keep that energy up. The power is building.",
    'I see you working. That is exactly what stamina looks like. Stay with it.',
    'That burn? That is the tissue changing. That is definition being earned right now.',
    "You've got more in you. I know it. Give me one more clean rep.",
    'This is the part where most people quit on themselves. You are not most people. Keep going.',
    'Stay honest with me here. Clean reps now mean real power later.',
    'I am proud of what I am watching. Keep stacking these. That is how lean gets built.',
    'You are tired. Good. That means it is working. Stay in it with me.',
    'One more. Just one. That is the rep that turns effort into growth.',
    'Look at you go! This is exactly the kind of work that shows up on the body.',
    "Don't check out on me now. This middle stretch is where the real mobility gets built.",
    'You are doing better than you think you are. Trust it. Keep moving.',
    "That's the stuff! Every rep like that is stamina you get to keep.",
    'Breathe. Reset. Next rep. You are still building something real here.',
    'I know it is hard. Hard is where the growth lives. Stay with me.',
    "You are not alone in this set. I am right here pushing with you. Let us finish this block strong.",
  ],
  final: [
    'This is it, the part that counts most. Empty the tank, {name}. I have got you.',
    'Last couple sets. This is where power gets locked in. Give me everything you have left.',
    'Finish this like you mean it. That is how definition shows up next week.',
    'I know you are spent. Find one more. That is the rep stamina remembers.',
    "You've earned the right to push hard here. Take it. Let us close this out strong.",
    'This is the finish that makes the whole hour worth it. Let us go get it.',
    "Almost there, don't leave anything in the tank. This is your power, take all of it.",
    'Final sets, full effort. That is how you walk out of here with more than you brought in.',
    'You are stronger right now than you were an hour ago. Prove it on this last set.',
    'Let us lock this in together. One more honest set and the growth is yours for good.',
    'I want to see everything you have got right here. This is the moment, {name}.',
    'This last push is where the mobility really shows up. Give it everything.',
    "You didn't come this far to slow down now. Finish like a champion. I mean that.",
    'Empty it out. That empty feeling? That is stamina you get to carry all week.',
    'This is the set people remember. Make it count. I am proud of you already.',
    'Last one. Give it your full heart. That is how you leave here better than you came.',
  ],
  exit: [
    "Hey, don't rack that yet. I know you can finish this. Get back under the bar with me.",
    "I hear that voice telling you to stop. It's lying. You've got one more in you, let us prove it.",
    "You didn't walk in here to walk out early. Come back. Let us finish what we started.",
    "Fatigue talks a big game. Don't believe everything it says. Twenty percent more, right now.",
    'I know this is the hard part. It is supposed to be. That is exactly where the growth is.',
    "Leave now and you carry a smaller win home. Stay, and you carry the real one. I'd stay.",
    "You've got permission to be tired. You don't have permission to quit on yourself yet. Get back in.",
    "Pain passes. What doesn't pass is knowing you walked away. Let us not do that today.",
    'Stand up. Lock in. I am right here with you. We finish this together.',
    "You want the results? This is the toll booth. Pay it. I'll pay it with you.",
    "Stop apologizing to your body. It can do this. Trust it. Lift.",
    "You came here to prove something to yourself. This is the moment. Don't skip it.",
    "Don't be a spectator in your own workout. Get back in the game, I need you in it.",
    'No bargaining today. Grab the handles. Let us go, together.',
    "We're not done until the work is done. Half a session is half the belief you get to keep.",
    "Don't you dare quit on set three. Set three is exactly where this gets real.",
    'Be stronger than the excuse. That is the only decision that matters right now.',
    "I'm not going to talk you out of feeling tired. I am going to ask you to lift anyway.",
    'Whatever story you are telling yourself, put it down. Pick the bar back up instead.',
    'The growth you want is in the rep you want to skip. Go get it.',
    'Zero shortcuts today. Full effort, full credit. Let us finish this the right way.',
    'Show me what you are made of. Mind in it, {name}. I know it is more than this.',
    'Finish the job. Leave the doubt on the floor, not the weight.',
    "I'm not asking a third time. I'm just going to stand here believing in you until you do. Get back under the bar.",
  ],
  complete: [
    "That's what I'm talking about, {name}! You showed up and you delivered. That is growth, and nobody can take that rep back from you.",
    "Look at what you just did. That is stamina you didn't have an hour ago. Be proud of that. I am.",
    "You did not break. You stayed. That's exactly the kind of stamina that compounds.",
    'That last rep, you gave it everything. That is definition, right there.',
    'Proof positive. You can finish what you start. That is lean you get to keep.',
    'Full session, full effort. That is rare. I noticed every bit of it.',
    'Another deposit in the bank. More growth than you walked in with.',
    "You conquered that bar today. Chest up, {name}. That's power, and it is yours.",
    'Discomfort turned into definition right in front of me. You stayed. That is everything.',
    'No shortcuts. You did every single thing I asked. That is rare, and I see it.',
    "Victory is a habit. Let us keep building it, one honest session at a time.",
    'The hard part is over. Rest up, let that lean settle in.',
    'You beat the version of you that walked in here. The one walking out has more power.',
    'Pain fades. What you just earned stays. Remember that.',
    'Breathe, {name}. You pushed right up to the edge. That is stamina, and it is real.',
    "Most people talk themselves out of this. You didn't. That is the definition showing up.",
    "You came in with doubt and you're leaving with proof. I am not done being proud of you.",
    'Job done, and you looked like you belonged out there. That growth belongs to you.',
    'That is character, not just muscle. Power and lean both showed up today.',
    'Walk out of here proud. You earned every bit of that hour.',
    'From the first rep to the last, you stayed with it. That is mobility you can trust.',
    "Another brick in the wall. Real work. Real growth. I don't say that lightly.",
    'When it got heavy, you found another gear. That gear is yours now, keep it.',
    "Recover well. The session's won. I'll see you at the next one, ready for more power.",
  ],
  bonusComplete: [
    "You didn't owe me that extra work, you gave it anyway. That is growth compounding, {name}.",
    'Extra credit, and I noticed every rep of it. That is the kind of stamina that separates you.',
    'Bonus locked in. You went past the week. That is definition you built on your own time.',
    'The four-day crowd can watch. You went the extra mile. That is power, not decoration.',
    'You went past what was asked. Rest up, let that lean land properly.',
  ],
  optionalComplete: [
    "Optional locked. You didn't owe me those ten minutes, you gave them anyway. That is stamina.",
    'Easy work, full effort. You stayed for the whole clock. That is mobility you can bank.',
    'Five hundred pounds on the house, and you earned every bit of it by staying.',
    'Extra minutes, extra work. I heard that stamina building the whole time.',
    "Warmup and cooldown aren't decoration, you treated them like they mattered. That is how mobility closes the gap.",
  ],
  weekPlace1: [
    'You took the week, {name}! Days and iron, both. That is power the whole house can see.',
    'First place. You earned that, one honest session at a time. That is stamina paying off.',
    "Gold is not luck. You built it. That is growth you can be proud of.",
  ],
  weekPlace2: [
    'Second place, and close enough to hunt. First is right there. Go get it next week.',
    "Silver looks good on you. I want to see gold next. You've got the power for it.",
    "You placed. That is not nothing. Bring a little more next week and it is yours.",
  ],
  weekPlace3: [
    'Third place, {name}. You are on the board, and that is real growth showing up.',
    'Bronze today. That is a start, not a ceiling. Let us build on it.',
    'You showed up and you placed. That is stamina worth being proud of.',
  ],
  resume: [
    "Hey, {name}, you left this open. I've been waiting right here. Let us go finish what you started.",
  ],
  missedWeek: [
    '{name}, last week closed without you. No judgment, just come back. The growth is still here waiting.',
  ],
  setUpTitle: 'THERE IT IS!',
  setUpBody: 'The load went up and you handled it. That is power showing up right on schedule.',
  setDownTitle: "Let's build back up",
  setDownBody: 'That is a step back, not a setback. Get back to what you know you can do.',
  hardness: {
    1: { title: 'TOO EASY', body: "You had way more in the tank than that. Let's add some weight, I know you can handle it." },
    2: { title: 'LIGHT WORK', body: "You held back a little there. I felt it. Next set, give me more, you've got it." },
    3: { title: 'HONEST WORK', body: 'That met you right where you are at. Stay there, or go up. Either way, that is growth.' },
    4: { title: "THAT'S THE STUFF", body: 'You felt that one, didn\'t you? Good. That is definition getting built right there. Stay in it with me.' },
    5: { title: 'YOU EMPTIED IT', body: "That is everything you had, and you gave it. That is power. I'm proud of you for that one." },
  },
};

const PACKS: Record<CoachTone, LinePack> = {
  master: MASTER,
  james: JAMES,
  luna: SERGEANT,
  eli: ELI,
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

export function fillCoachName(text: string, name?: string | null): string {
  if (!text.includes('{name}')) return text;
  return text.replace(/\{name\}/g, firstName(name));
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
  tone?: CoachTone | null,
  name?: string | null
): string {
  const phase = workoutPhase(completedSets, totalSets);
  return fillCoachName(pickFrom(packFor(tone)[phase], `coach:${normalizeCoachTone(tone)}:${phase}`), name);
}

export function pickExitLine(tone?: CoachTone | null, name?: string | null): string {
  return fillCoachName(pickFrom(packFor(tone).exit, `exit:${normalizeCoachTone(tone)}`), name);
}

export function pickResumeLine(tone?: CoachTone | null, name?: string | null): string {
  const id = normalizeCoachTone(tone);
  const live = getLinePack(id);
  const pool = live?.resume && live.resume.length ? live.resume : PACKS[id].resume;
  if (pool.length) return fillCoachName(pickFrom(pool, `resume:${id}`), name);
  return pickExitLine(tone, name);
}

export function pickCompleteLine(tone?: CoachTone | null, name?: string | null): string {
  return fillCoachName(pickFrom(packFor(tone).complete, `complete:${normalizeCoachTone(tone)}`), name);
}

export function pickReplenishLine(): string {
  return pickFrom(REPLENISH_LINES, 'replenish');
}

export function pickBonusCompleteLine(tone?: CoachTone | null, name?: string | null): string {
  const id = normalizeCoachTone(tone);
  const live = getLinePack(id);
  const pool =
    live?.bonusComplete && live.bonusComplete.length
      ? live.bonusComplete
      : PACKS[id].bonusComplete;
  return fillCoachName(pickFrom(pool, `bonus:${id}`), name);
}

export function pickOptionalCompleteLine(tone?: CoachTone | null, name?: string | null): string {
  const id = normalizeCoachTone(tone);
  const live = getLinePack(id);
  const pool =
    live?.optionalComplete && live.optionalComplete.length
      ? live.optionalComplete
      : PACKS[id].optionalComplete;
  return fillCoachName(pickFrom(pool, `optional:${id}`), name);
}

export function pickMissedWeekLine(name: string, tone?: CoachTone | null): string {
  const id = normalizeCoachTone(tone);
  const live = getLinePack(id);
  const pool = live?.missedWeek && live.missedWeek.length ? live.missedWeek : PACKS[id].missedWeek;
  const template = pool[0] || PACKS.master.missedWeek[0];
  return fillCoachName(template, name);
}

export function pickWeekPlaceLine(place: 1 | 2 | 3, tone?: CoachTone | null, name?: string | null): string {
  const id = normalizeCoachTone(tone);
  const key = place === 1 ? 'weekPlace1' : place === 2 ? 'weekPlace2' : 'weekPlace3';
  const live = getLinePack(id);
  const pool = live?.[key] && live[key].length ? live[key] : PACKS[id][key];
  return fillCoachName(pickFrom(pool, `week-place:${id}:${place}`), name);
}

function namedCopy(
  copy: { title: string; body: string },
  name?: string | null
): { title: string; body: string } {
  return { title: fillCoachName(copy.title, name), body: fillCoachName(copy.body, name) };
}

export function setProgressCopy(
  direction: 'up' | 'down',
  tone?: CoachTone | null,
  name?: string | null
): { title: string; body: string } {
  const pack = packFor(tone);
  if (direction === 'up') {
    return namedCopy({ title: pack.setUpTitle, body: pack.setUpBody }, name);
  }
  return namedCopy({ title: pack.setDownTitle, body: pack.setDownBody }, name);
}

export function hardnessCopy(
  score: 1 | 2 | 3 | 4 | 5,
  tone?: CoachTone | null,
  name?: string | null
): { title: string; body: string } {
  const id = normalizeCoachTone(tone);
  const live = getLinePack(id)?.hardness?.[score];
  if (live?.title || live?.body) {
    return namedCopy({ title: live.title, body: live.body }, name);
  }
  return namedCopy(PACKS[id].hardness[score], name);
}
