# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Rewrite Master Tom Iron’s mail and every catalog slot in the locked Box Hill / *Pillion* register (implication, control, **quit** as the noun, **man** in the body, no orphan `Man.`, no bikes). Ship **James Grey** (`james`, Grey for short) as a third picker voice with a full line pack and mail that follows the pick. **Luna Meadows** (`luna`) to the same coverage. Tom from→to and Grey category copy **approved**. Shipped 5.2.0 / 5.2.1.

## Critical Decisions

- **Tom register:** Mars-Jones + Lighton, **more bite**. Short commands. Possession. Implication, not a scene. Never say **changelog** (athlete does not know that word). Sign **Master Tom Iron** on every letter he sends, including release and Kevin ops mail.
- **Quit, not sissy:** `Get back under the bar. Quit is not a name I use for you.` Pattern, not one frozen line everywhere.
- **Man:** Keep in the body. Drop the greeting `Man.` Use the given name (`Christine.`).
- **Home screen steps:** Welcome and invite only. Strip from release.
- **Release sandwich:** Intro, one mid line, and close speak in Tom or Grey. The **what we did** middle is plain English and visual (gold headings, one fact per line, stacked labels). No developer words. No voice in the feature list. Harder Exit/Complete set is rejected; keep the liked set.
- **James Grey:** New `users.coach_tone` value `james`. Display **James Grey**, Grey for short. From-name **James Grey**. E.L. James + Kelly Marcel. Dornan, British. Heat closer to the books. Style only. No lifted lines.
- **Mail follow the picker:** `master` → Tom. `james` → Grey. `luna` → Luna (old id `sergeant` still reads).
- **Belts:** Rewrite Tom `coachLine` only. Quotes and `saidBy` stay.
- **Prod lines:** Hand SQL. Fallback packs in `lib/coachLines.ts` / `lib/coachCatalog.ts` match. Keep a from→to list in this plan as we apply it.
- **Bonus reward (Tom + Grey only):** Aftercare / I take care of you / you earned the quiet. No sexual body talk (no hands, kneel, put you down). Grey may stay closer to the books without sex. Luna bonus unchanged.
- **Replenish is its own deck:** After every finished workout, shuffle one tip from a shared list (all voices). Not baked into the complete shout. Shows on the finish takeover and in the recap mail under the shout. Luna complete pack stays.
- **Out of run:** Literal Christian Grey. Motorcycle talk. Book/film quotes. Admin Mail voice pills (preview still defaults Tom; compare pack used instead).

## Approve before build

### Tom from → to (sample)

If this register is wrong, stop. Do not write the rest of Tom until this is approved.

**Exit (resume shout)**

| From | To |
|---|---|
| `DO NOT RACK THAT WEIGHT. Get back under the bar, sissy!` | `Do not rack that. Get back under the bar. Quit is not a name I use for you.` |
| `Look in the mirror. Are you my good man, or a quitter?` | `Look at me. My man, or quit? Pick.` |
| `Zero compromise, pup. Deliver the full workout!` | `No deal. I still own this session. Finish it.` |

**Complete (recap shout)**

| From | To |
|---|---|
| `THAT IS HOW YOU FINISH. Watching you drive through that last rep turned me completely on.` | `That is how you finish. I watched. You do not get to look away.` |
| `DISCOMFORT IS NOW GROWTH. You took the pain like a sissy, now enjoy the gains.` | `That hurt. You took it. Quit never got a turn. Good man.` |
| `NOW RECOVER LIKE A PRO. The battle is won. Now come home and let me reward you.` | `Tax paid. Recover. Then come home. I am not done with you.` |

Then a **separate** replenish line (shuffled, same list for Tom / Grey / Luna). See below.

**Hardness 4**

| From | To |
|---|---|
| title `THAT COST YOU` / `Good man. Hard is the point.` | title `THAT COST YOU` / `Good man. Hard is the point. Stay there.` |

**Belt coachLine (2 weeks)**

| From | To |
|---|---|
| `You showed up. Two locked weeks. The water is not that cold, man.` | `Two locked weeks. You showed up. I have you, man.` |

**Release (sandwich). Feature list is not in Tom’s voice.**

`currentRelease.ts` grows three voice strings plus plain groups:

- `intro` — Tom or Grey (one short paragraph)
- `mid` — Tom or Grey (one line, after the first visual block)
- `close` — Tom or Grey (before REPORT IN)
- `groups` — plain English only. Gold heading. One fact per bullet. Stacked `label — meaning` where it helps (belts, Who pills).

Example, 5.0.0, Tom, to Christine:

```
Christine.

Do not skim. These are orders. Read them. I do not repeat myself for quit.

THE YEAR
Weeks 1 to 6     two lower days. That is the start.
Week 7 on        one lower, A then B.
Friday           Extra Upper.
Saturday bonus   core in the app, or a run or class you mark.
Lock a week      four finishes. Missed days still count.

I put the year on paper. Stay on it.

THE BELTS
2 weeks    Dipping your toes
6 weeks    Got back in the saddle
10 weeks   I see you getting stronger
20 weeks   Steady
24 weeks   Weigh-up sprint
48 weeks   Arnold Status

HOME
You see three belts: the one you hold, the one you are filling, the next one.

WHO
Solid     you earned that belt
Aiming    you have not locked it yet

THE SESSION
Last lift      scrolls you to Easy cooldown
Finish it      under that card, phone and desktop
Header         does not close the day

Hard-refresh. Open Home. Then get under the bar.

REPORT IN
Master Tom Iron
```

Grey: same middle. Intro / mid / close in his register (`You will read this. I want you to understand it.` / `This is what changed. Keep it.` / `Refresh. Then come back to me.`).

Luna: same middle. Intro / mid / close in hers (`Read this when you can. I want it to be clear.` / `This is what changed. Take it in.` / `Refresh. Then come back when you are ready.`).

**Bonus (Tom + Grey). Care as the reward. Not sex.**

| Tom | Grey |
|---|---|
| You did not owe me that, man. You paid anyway. That earns aftercare. I look after my men. | You did not owe me that. You paid. Aftercare is the reward. You will take it. |
| Extra credit. Come home. You get the quiet I do not give quit. | Extra. Come home. I want to look after you. That should bother me. Tonight it does not. |
| Bonus locked. Good men get taken care of. That is the reward. | Bonus locked. Aftercare is in the terms when you go past the week. |
| The four-day men can watch. You stayed. I pay that debt. | The four-day men can watch. You stayed. I pay what I owe. |
| You went past the week. Home. Sit. I have you. | You went past the week. Home. Sit. I have further care for you. |

Luna bonus unchanged.

**Replenish deck (all voices, shuffle one per finished workout)**

Same seven lines. Not in Tom’s bark. Not in Grey’s contract. Shown under the complete shout.

1. Rehydrate with at least 16 ounces of water.
2. Grab a snack mixing quick carbs and lean protein within 45 minutes.
3. Refuel your muscles and jumpstart recovery.
4. To restore glycogen stores and initiate muscle tissue repair, consume 16–24 oz of fluid.
5. To restore glycogen stores and initiate muscle tissue repair, consume a 3-to-1 ratio of carbohydrates to protein inside your post-workout metabolic window.
6. Chug a big glass of water.
7. Hit the kitchen for a banana and protein shake before your body even realizes how hard you just worked.

Finish screen / recap mail:

```
That is how you finish. I watched. You do not get to look away.

Hit the kitchen for a banana and protein shake before your body even realizes how hard you just worked.
```

Next finish draws the next unused tip, then reshuffles.

**Talk to me (widget, still Tom)**

| From | To |
|---|---|
| `Talk to me, man.` | Keep. Body address, not a greeting line. |

### Three voices, same moment

All three voices shipped. Luna is Nicole McPherson register. Tom and Grey are the locked register.

Live app today: **16** first-set, **16** mid, **16** last-set (shuffle, no repeat until the deck empties). Exit 24, complete 24. The table below is **8 each** so you can hear the set. Decide later: keep 16 or ship 8.

| Slot | Master Tom Iron | James Grey | Luna Meadows |
|---|---|---|---|
| Picker | Direct. I own you. Quit is not a name I use. Good man stays good man. | Grey. Private. He wants you present, and he wants it kept. | Calm. Soft. She will still hold you in the hard part. |
| Open (initial) | Look at the weight. Then take it from me. | Look at me. Then take the first plate. That is the agreement. | This first set is a hello to your body. Make it sincere. |
| Mid set | You are not tired. You are being trained. Difference. | Halfway is not mercy. It is the middle of the terms. | Midway is not a verdict. It is a checkpoint. Pass through. |
| Last sets | Those last two reps belong to me. | Those last two reps are in the agreement. Deliver them. | These final moments are where your growth blossoms. Stay with it. |
| Walk-off (exit) | Do not rack that. Get back under the bar. Quit is not a name I use for you. | Do not rack that weight. Get back under the bar. Quit is not a name I use for you. | Breathe, stay present, and stay right here on your mat. You aren't done yet. |
| Walk-off 2 | Look at me. My man, or quit? Pick. | Look at me. Are you my man, or is quit the name you want? | Check in with your spirit. Are you honoring your practice, or bowing out early? |
| Finish (complete) | That is how you finish. I watched. You do not get to look away. | That last rep. I wanted it. You gave it. Come here. | What a beautiful finish. Watching you move through that last movement was inspiring. |
| Finish + replenish | Same shout, then one shuffled tip from the shared seven. | Same. | Same. |
| Bonus | You did not owe me that, man. You paid anyway. That earns aftercare. I look after my men. | You did not owe me that. You paid. Aftercare is the reward. You will take it. | You gave more than the week asked. Thank you for that extra care. |
| How hard (4) | THAT COST YOU. Good man. Hard is the point. Stay there. | IT COST YOU. Good man. Hard is the point. I keep you there. | Hard. You stayed with the difficulty. Beautiful. |
| Release intro | Do not skim. These are orders. Read them. I do not repeat myself for quit. | You will read this. I want you to understand it. | Read this when you can. I want it to be clear. |
| Release mid | I put the year on paper. Stay on it. | This is what changed. Keep it. | This is what changed. Take it in. |
| Release close | Hard-refresh. Open Home. Then get under the bar. | Refresh. Then come back to me. | Refresh. Then come back when you are ready. |
| Release middle | Same for all: plain English, visual labels. Not in anyone’s voice. | Same. | Same. |

---

### James Grey — full verbiage by category

Tone: British, quiet, precise. Want. Gym-plain, not office talk (no contract / terms / agreement / list). No “Laters, baby.” No Red Room. No lifted Grey lines. Address **man** where Tom would. Sign **James Grey**. Short form in body: **Grey**.

**Picker**

- Label: `James Grey`
- Blurb: `Grey. Private. He wants you present, and he wants it kept.`
- Description: `Precise, British. He takes you under his watch. He wants you and hates how much. Praise is rare. The session is not a joke.`
- From-name: `James Grey`

**initial (16)**

1. Look at me. Then take the first plate. That is the agreement.
2. I should not want this hour as much as I do. Take the bar anyway.
3. You walked in. The terms started. I want a clean opener.
4. Soft hands are a tell. I notice. Lock in.
5. This is not a warm chat. It is the first set. Honour it.
6. I have thought about you on this floor. Now prove I was right.
7. Feet set. Breath set. You do not get to hide in the unrack.
8. I want you present. Not charming. Present.
9. The contract is simple. You start when I say. You start now.
10. Do not look at the door. Look at the load I gave you.
11. I am not here to be liked. I am here to see you take it.
12. First inch. I watch that more than the last.
13. You asked for me. This is what that costs.
14. Quiet, man. Then move.
15. I will be civil. I will not be soft. Unrack.
16. If you came to negotiate, you came to the wrong room.

**mid (16)**

1. Halfway is not mercy. It is the middle of the terms.
2. I want cleaner reps. I want them from you.
3. That burn is information. Stay with it. I am.
4. Do not invent a story. Do the next set.
5. I should let you breathe. I will not. Brace.
6. You are mine for this minute. Spend it lifting.
7. Soft now and I will know. I always know.
8. Look at me if you need a reason. Then lift.
9. I want you tired and still honest.
10. The easy part is over. That was the courtesy.
11. Form first. Then I will allow the violence.
12. Do not smile at the pain. Use it.
13. I am still in the room. That is not a comfort. It is a fact.
14. If you can talk, you can give me another rep.
15. Mid-session is where people become quit. You will not.
16. I want the next set more than I should. Give it to me.

**final (16)**

1. Last third. This is the part I remember. So will you.
2. Those last two reps are in the agreement. Deliver them.
3. I want you empty. Then I will let you leave.
4. Finish it. Make me certain I chose well.
5. Do not save anything for later. Later is not in the terms.
6. Pain is not the point. Obedience through the pain is.
7. Lock out like you intend to come back to me.
8. I will know if you cheat the last plate. Do not make me say it twice.
9. Stand up. Breathe. Take what is left. I want it.
10. This is how a man closes a session I ran.
11. Finish ugly if you must. Finish.
12. I should tell you to stop. I will not.
13. The clock does not release you. I do.
14. One more honest set. Then you may look at me.
15. Leave nothing I asked for in the rack.
16. Last call. Deliver, or explain yourself. I dislike explanations.

**exit (24)** — resume / walk-off

1. Do not rack that weight. Get back under the bar. Quit is not a name I use for you.
2. Did I dismiss you? I did not. Hands back on the bar.
3. You do not walk out on terms you accepted. Return.
4. Look at me. Are you my man, or is quit the name you want?
5. Fatigue is a story. I want the next twenty percent. Now.
6. Leave and you will carry it. Stay and I will still be hard. Pick.
7. I did not give you permission. The set is open.
8. Pain passes. Quit stays on your name. Pick up the bells.
9. Stand up. Lock in. I am watching you. I want you back on the floor.
10. You wanted results. The contract is reps. Complete them.
11. Stop pitying yourself. Sweat is not injury. Lift.
12. You came here to submit to the work. Get to it.
13. Do not spectate your own session. Maximum effort. Now.
14. No negotiations. Handles. Push.
15. You do not leave until every rep I named is done.
16. Do not you dare give up on set three. Remember who this is for.
17. Decide to be stronger than laziness. That is the only decision.
18. Quiet. Lift. Do not rationalise quit to me.
19. Leave the weak story. Lock into this set.
20. Your progress lives in the reps you want to skip. Do them for me.
21. Zero compromise. Deliver the full hour.
22. Show me what you are. Mind in it. Now.
23. Finish the job. Leave it on the floor, or do not come back asking for me.
24. I want you under that bar. I will not ask a third time.

**complete (24)** — shout only. Replenish is a second shuffled line.

1. You finished. I am not easy to impress. You managed it.
2. The terms are satisfied. I watched. I wanted you to see that I watched.
3. You did not break. I am more relieved than I will admit.
4. That last rep. I wanted it. You gave it. Come here.
5. Proof. You can keep an agreement. That matters more than the load.
6. The tax is paid. In sweat. I find that acceptable.
7. Another deposit. You are stronger than this morning. I noticed.
8. You conquered the bar. Chest up, man. You are not quit.
9. Discomfort became something I can use. You stayed. Good.
10. No shortcuts. You did every thing I named. That is rare.
11. Victory is a habit I intend to keep you in.
12. The hard part is over. Now you will recover because I said so.
13. You beat the man who walked in. I prefer this one.
14. Pain leaves. What you did for me stays. I will remember it.
15. Breathe, handsome. You pushed the edge I set. You won.
16. Most people become quit. You did not. I wanted you not to.
17. You faced it, took it, and came out on top. I am not done with you.
18. Job done. You looked like you belonged to the work. You did.
19. Character. Not just muscle. I asked for both.
20. Walk out proud. You made me certain. That is not nothing.
21. From the first unrack to the lockout, you were under control. Mine.
22. Another brick. Serious work. I do not say that lightly.
23. When it got heavy you found another gear. I wanted that gear.
24. Recover properly. The session is won. Come home. I have further terms.

**bonusComplete (5)** — aftercare, not sex

1. You did not owe me that. You paid. Aftercare is the reward. You will take it.
2. Extra. Come home. I want to look after you. That should bother me. Tonight it does not.
3. Bonus locked. Aftercare is in the terms when you go past the week.
4. The four-day men can watch. You stayed. I pay what I owe.
5. You went past the week. Home. Sit. I have further care for you.

**optionalComplete (5)**

1. Optional locked. Ten minutes you did not owe. You paid them.
2. Easy work, real pounds. You stayed for the clock. I wanted that more than the theatre.
3. Five hundred on the house. Cheap if you stay. Costly if you skip. You stayed.
4. Extra minutes. Extra iron. I heard it. So did the board.
5. Warmup and cooldown are in the terms when you take them. You took them. Good man.

**set up / set down**

- setUpTitle: `I LIKE THIS`
- setUpBody: `The load is climbing. Stay in the agreement.`
- setDownTitle: `That is not what we agreed`
- setDownBody: `Put the weight back. I did not ask for less.`

**hardness**

| Score | Title | Body |
|---|---|---|
| 1 | TOO EASY | A courtesy set. Next one we add. I want it to cost. |
| 2 | LIGHT | You had more. I felt it. Do not hide in light. |
| 3 | HONEST | A working set. Stay there or go up. I will allow either if it is true. |
| 4 | IT COST YOU | Good man. Hard is the point. I keep you there. |
| 5 | MAX | You emptied it. I saw that. I wanted to see it. |

**Mail Grey writes (when tone is `james`)**

Same facts as Tom. Different hold.

- **Welcome:** Subject `You are on my list. Work-It.` Title `You are mine now`. Body: roster is not a suggestion; PIN; show me; inspect. CTA `REPORT IN`. Home-screen block stays.
- **Invite:** Same hold. Inviter put them on Grey’s list. CTA `CREATE YOUR PIN`. Home-screen block stays.
- **Nudge:** Title `{day}. Now.` Shout from `initial`. `I own that session.` CTA `GET TO IT`.
- **Resume:** Title `Did I dismiss you?` Shout from `exit`. Open session is unfinished terms. CTA `FINISH IT`.
- **Complete / week / program:** Name. `completeLine`. Stats. Belt progress. Next belongs to him. CTA `SHOW ME` / `COME HOME`.
- **Badge:** `Good man. {badge}.` You earned it because you kept the terms. Now the next one.
- **Belt:** Quote and `saidBy` unchanged. Grey `coachLine` variants (write at implement, same facts as Tom’s new lines).
- **Release:** Sandwich. Grey intro / mid / close if tone is `james`. Plain visual middle shared. No home-screen block. No orphan `Man.`
- **Scoreboard / invite-notify / Talk to me / digest:** Still From Tom unless the letter is to an athlete whose tone is `james`. Kevin ops stay Tom (operator mail, Tom’s house).

---

## Tasks:

- [x] 🟩 **Step 1: Approve copy**
  - [x] 🟩 Tom from→to sample signed off.
  - [x] 🟩 Grey category list signed off (gym-plain; no contract). Production picker matches.
  - [x] 🟩 Approved. Shipped.

- [x] 🟩 **Step 2: Tone id `james`**
  - [x] 🟩 `lib/coachTone.ts`: `master` / `james` / `luna`. Default `master`.
  - [x] 🟩 Catalog / lines / hydrate / `GET /api/coach-catalog` accept three packs.
  - [x] 🟩 Edit profile shows three voices.

- [x] 🟩 **Step 3: Tom catalog + belt coachLines**
  - [x] 🟩 Tom slots rewritten. Bonus = aftercare. First/mid/last stayed 16.
  - [x] 🟩 Shared replenish deck. Finish takeover + recap.
  - [x] 🟩 Tom blurb / description (no `sissy`).
  - [x] 🟩 `lib/belts.ts` Tom `coachLine` plus Grey / Luna variants.

- [x] 🟩 **Step 4: Grey catalog**
  - [x] 🟩 Grey pack in fallback + `migrate-james-voice.sql`. Applied on PlanetScale.

- [x] 🟩 **Step 5: Mail templates**
  - [x] 🟩 Tom / Grey / Luna mail follows the pick. Release sandwich. No home-screen on release.
  - [x] 🟩 Invite uses inviter tone. Kevin ops stay Tom.
  - [x] 🟩 Voice compare pack sent (Admin Mail preview still defaults Tom).

- [x] 🟩 **Step 6: Standing orders**
  - [x] 🟩 `document.md` + `CLAUDE.md`. Luna id `luna`. `/document` rewrites `currentRelease.ts` and mails.

- [x] 🟩 **Step 7: Check**
  - [x] 🟩 Profile: three coaches. Test can pick. Production picker matches.
  - [x] 🟩 Luna on-screen. Her mail. Replenish under her finish shout.
