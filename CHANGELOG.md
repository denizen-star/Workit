# Changelog

## Unreleased

## 7.3.0 - 2026-09-08

### Fixed
- Join wizard PIN confirmation: a correctly re-typed PIN could get falsely rejected ("PIN must be four matching digits") because the confirm step submitted a stale copy of the PIN missing its last digit
- Join wizard PIN mismatch no longer leaves you stuck on 4 filled, disabled dots with no way forward — it now shows an error and drops you back to re-enter the PIN

### Added
- Join wizard (`/join`): progress bar (Details / PIN / Done) and a Back button on every step, so you can fix an earlier answer without starting over

## 7.2.4 - 2026-09-07

### Changed
- Email sender name defaults to "Workit - Coach Tom" / "Workit - Coach James" / "Workit - Coach Luna" (was "Master Tom Iron" / "James Grey" / "Luna Meadows") when a coach voice has no sender name set in the database

## 7.2.3 - 2026-09-07

### Changed
- Noise Control simplified to plain On/Off for the set-result and effort-result screens. "Once per exercise" is gone — it depended on tracking exactly when an exercise finished across extra sets and mode switches, and kept firing at the wrong time or with the wrong message. On/off is reliable; anyone previously on "Once per exercise" now reads as On

## 7.2.2 - 2026-09-07

### Fixed
- Repeated "NEW PR" on resume: your all-time record now includes sets you already completed earlier in the same (resumed) session, not just prior sessions — logging the same weight again on set 2/3 no longer re-fires the PR flash
- Noise Control "Once per exercise" for perceived load: the effort summary now fires the moment the exercise is done, not only after you vote on the last set — skipping the last vote (allowed) used to mean it never showed. Skipped votes count as Fair, same as everywhere else
- When both Noise Control dials are set to "Once per exercise," the result summary and the effort summary now combine into one message instead of the second silently replacing the first

## 7.2.1 - 2026-09-07

### Fixed
- Noise Control "Once per exercise": the set-result summary now shows even when the exercise's last set has no direction of its own (a silent/same-weight set) — it was silently skipping the whole exercise in that case

## 7.2.0 - 2026-09-07

### Added
- **Noise Control** in Edit profile: pick how often the app talks to you. Set/rep result screens and Perceived-load result screens each go Every set / Once per exercise / Off. New PR screen has its own on/off. PRs still land in your recap email either way
- Edit profile: Coach voice, Noise Control, and Workout sound are now fold-open sections
- "Last time" chip on each exercise now shows the Effort score from that set too

### Changed
- Timed exercises (plank, holds): tapping Stop on the clock completes the set right away — no extra tap needed
- Live workout: the current set gets a gold border, and How hard gets one the first time it shows up, so it is obvious what to do next
- Live workout: scrolling down folds the week/focus header and Today/All-time bar into the sticky bar up top, so exercise cards get more room. Scroll back up to bring it back
- Rest timer pulses gold and buzzes each second in the last 5 seconds
- Home: the last-week medal no longer squeezes your workout title — text uses the full card width

### Fixed
- Rest-timer coach lines no longer say "last third" — plain "final sets" instead

## 7.1.0 - 2026-09-07

### Added
- Optional Run and Bike now show total time cycling and running: on Your performance (by period) and The house (Running & cycling honor roll)

### Changed
- Optional Run and Bike no longer auto-stop at 10 minutes. Clock counts up past 10 and you tap Done when you are done
- Profile photo: bigger circle, zoom slider full width below it, Change button next to the photo. Drag to recenter (Center button removed)
- Login remembers your email on this phone and lets the browser fill the PIN
- Header photo stays next to the menu; the cropper opens on your saved picture; a `?` explains you can drag it
- Profile form: email is required and validated. Phone formats as you type ((347) 555-1234). Photo sits above email on Edit profile and Join

### Fixed
- Profile photo: dragging while zoomed in used to snap back to the old zoom level. Drag now always uses your current zoom
- New profile photos no longer get hidden behind the old cached one

## 7.0.0 - 2026-09-06

### Added
- **Log in** at `/login`: email + 4-digit PIN. Live host **workitapp.fit**
- **Join the movement** at `/join?h=gowanus`: intro, profile, waiver, PIN. New people verify mail before Home. Coach Luna
- Two houses: **The OG** and **Gowanus**. Invite stays in the house that sent it. Menu switch if you are in both
- Waiver on join and first Home for people who have not accepted. Exact text + time stored. Link in welcome mail (`/waiver`)
- How to use (`/how`). Home banner until 5 finished workouts
- Profile: first name, last name, alias, phone, weight lb, circle photo. Full name is first + last

### Changed
- No name picker. `/` and `/who` go to `/login` (or Home if already in)
- Coach and mail use **alias**, else first name
- Existing athletes: first Home after this is Update your profile (prefilled) + required waiver
- Displayed totals abbreviate across the app (`12k`, `1.6k`, `141k`). Logged set weight and reps stay exact.
- Home last-week medal sits in the Today header row. It no longer pads the whole card or clip the four numbers
- You vs on a phone stacks You / them under each KPI. No spark. Days and Effort wrap.

## 6.0.0 - 2026-09-06

### Added
- Home Today: four window numbers — Weight, Reps, Volume, Effective (Volume × Perceived Effort)
- Live set tiles use the same four numbers vs last time that lift ran
- Finish recap: this workout vs last same day, then Continue
- Awards after the coach line: **YOU EARNED IT!** in your belt color. Full diploma card if you unlocked one. Next diploma named. New badges in a row of three

### Changed
- Effective is **Volume × Perceived Effort**. Fair = 1.0. Skip How hard = Fair. Place, week medals, and the live Today bar stay raw iron
- % is vs last time those lifts ran, not vs the last calendar window
- Finish used to be a shout, then medals, then Home. Now: stars → recap → coach line → awards → Home
- Leave early no longer scores the session. Stars only on Complete it
- Session stories and You vs: short Effective line. Helpers say Perceived Effort

## 5.8.0 - 2026-09-04

### Added
- **Hold line** on Home Today: last same day, heaviest set, Effort you voted. Wraps. First time: log the iron and Effort
- Live session: best-effort portrait lock. Rest and set chimes fire when the clock hits
- Stretch / Core: a still for each hold. Travel hanging knees / ab wheel: two video tabs

### Changed
- Stats lb is **after Effort** (How hard 1–5; skip = Fair / 60%). Optional +500 stays raw. Place, week medals, live Today bar, and badge iron stay on raw
- Effort on tiles: `4.3 · 86%`. Daily chart cream is Effort lb; the wash is your How hard that day
- Home Quiet: `W3 - Lower B`. One row: Start WO / Resume WO, Select WO, Invite. No belt-hunt sentence under the hero
- Your performance: Summary, then Details, then Progression. One lift line. One metric row. Period pills stay on one row
- Stronger is more iron (or the same) while Effort holds or drops. If the total rose only because Effort rose, you pushed harder

## 5.7.0 - 2026-09-04

### Added
- **Your tile** at the top of Your performance (Home fold and the tab). Same house card: rank, name, total lb, last workout, workouts / sets / heaviest / best day / avg time / medals / belt, plus the hunt line. Follows **T / T-1 / T-7 / T-15 / T-30 / All**. Empty window still shows you, zeros, and that the board moved
- Stretch and Core Optionals: tap **Easy / Medium / Hard** after the track. Six holds. Upper day vs lower day picks the list. Easy is gym mobility. Medium and Hard are short pilates / yoga. Stills, video, and how-to on each hold. Last Done still +500

### Changed
- You vs last time, how hard, gainers, losers, and the rest of Your performance stay under the tile. Nothing taken off Home or the tab
- Coach shouts pay or withhold **growth, lean, definition, power, stamina, mobility**. Finish, bonus, optional, leave, resume, missed week, How hard, and week medals use that prize. Not come home, not a night
- They say your **first name**. Not Good man as a greeting
- Open session: the growth already started without you. Missed last week: the power and the lean took the week off with you
- Welcome, invite, nudge, recap, badge, and diploma mail follow the same prize. Welcome subject is Report in (Luna stays You are welcome)
- Optional track labels: **Stretch** and **Core** (run/bike stay Easy run / Easy bike)

## 5.6.0 - 2026-08-31

### Changed
- **Your performance** reads top to bottom: you vs last time, how hard by workout, by workout, gainers, losers, how hard by lift, every lift. Bonus done and optional sit at the bottom
- Day pills are Eastern **T / T-1 / T-7 / T-15 / T-30 / All**. Opens on today. Same pills on the Home fold and on Admin Athletes. Home fold and Admin Athletes keep their old section order

### Added
- Kevin: check one or more athletes at the top of Your performance. Their weight and totals add on the same cards. Uncheck all and the board is empty. Test is in the list

## 5.5.0 - 2026-08-30

### Added
- **Tom, if you leave a session open.** Home says it. Resume says it. The come-back mail says it: you're late; late again and you stay out of the house
- More Tom lines in the session (start, middle, finish) and on How hard 5: **DO YOU GIVE?** / You must give
- Last week short of 4 finished sessions and no medal: first Home open, Tom asks if you were busy and if there is a booming market for you. Once. Test never sees it

## 5.4.0 - 2026-08-30

### Added
- **Week medals.** After Sunday, the closed Eastern week (Mon–Sun) gets gold / silver / bronze. Same rank as The house: finished days, then total lb
- First Home open after that Monday: celebration shout if you placed 1st, 2nd, or 3rd. Then your disc stays on the Start card. No place → nothing
- **Last weeks** on Medals: every weekly gold / silver / bronze you earned
- Kevin-only **Week medals** table on The house: athlete rows × gold / silver / bronze counts

## 5.3.0 - 2026-08-30

### Added
- **What is Work-It?** on Who. Short definition, then bullets. Claim also gets a short home-screen `?`
- **Forgot PIN** on login when that profile has email. Mail brings a one-hour link to set four new digits
- **`?` on every live lift.** Trainer-plain How (gym and travel). The italic note is off the card

### Changed
- Invite claim: three short lines under the name, then the pad. Dead links stay on Who and ask for a resend

## 5.2.2 - 2026-08-30

### Changed
- Live workout wash is louder: the belt you hold (or the one you are aiming for) tints the page, header, and cards. Home and Select Workout stay the default dark page

## 5.2.1 - 2026-08-30

### Changed
- Household release mail is one letter: 48-week year, belts, and the three coaches
- Belt and badge art in mail always loads from the live site, not localhost

## 5.2.0 - 2026-08-30

### Added
- **James Grey** in Edit profile (`james`). British want. Gym-plain, not office talk. Mail follows the pick
- **Luna Meadows** to par: Nicole McPherson register (soft voice, hard work). Her mail, belts, and bonus care follow the pick
- After every finished workout, a shuffled recover tip (water / food) under the finish shout and in the recap mail

### Changed
- Luna Meadows id is `luna` (old `sergeant` still reads until `migrate-luna-id.sql`)
- Master Tom Iron copy: implication and control. Quit is the noun. Aftercare on bonus, not sex. Signer Master Tom Iron on his mail, including release
- Release mail is a sandwich: voice intro / mid / close, plain labeled facts in the middle. No Add to Home Screen on release

## 5.1.0 - 2026-08-30

### Added
- Text archive of every successful send in `email_archive` (date, athlete name, From name, destination, template, subject, body). No HTML or images. No in-app viewer. Includes `/document` release mail

## 5.0.0 - 2026-08-29

### Added
- **48-week year.** Weeks 1–6 stay two lowers. Week 7+ one lower (A/B alternate), Extra Upper Friday, Bonus Core or a marked class
- **Belts / diplomas** at 2, 6, 10, 20, 24, 48 locked weeks. `/belts` glossary (Before / During / After), Home trophy chest, Who pills, The house, admin
- Recap mail shows belt progress + SVG. Crossing a belt sends a diploma mail. Medal mail includes the badge SVG
- Week 7+ bonus: logged core, or searchable / typed activity (run, yoga, Hyrox, …) that still counts toward the 4

### Changed
- **Finish it** sits after cooldown on phone and desktop. Last lift scrolls there. It does not open Finish
- Home banner is **this week** (Monday–Sunday, Eastern), not last 7 days. A locked week stays on Home through Sunday. Next week starts Monday
- You vs the house cards are two columns: cream you, copper them. Rank is days first, then lb
- You / house is you vs house **average**, not a pack total
- Vs the house names the lift and says lead / trail / closest
- Your performance cards say this weight, this total, vs last. That board is you vs you, not the house
- Daily house line is pack sum ÷ pack size. A miss that day counts as 0
- Streak is locked weeks in a row (any 4 finished days). Rest days do not break it
- Who pills: solid = earned, outline **Aiming ·** = still working toward it

### Fixed
- Who no longer paints every athlete as if they already earned Dipping your toes

## 4.5.0 - 2026-08-28

### Added
- Notes and thumbs **Mark done** (`feedback.resolved_at`). Open / Done pills
- Color system: gold = take this action, green = done/good, red = still a problem, copper = the house, cream = you

### Changed
- Optional + Bonus flag strip lives on **Your performance**, not Home
- Invite a friend is gold (Restart stays quiet gray)
- Daily weight / pack charts start at the first finished session. Days before the program stay off
- Week lock: gold = start here, green = done. Week performance: green / red
- How hard on Your performance cards and Home fold charts

### Fixed
- Week tiles say what good and bad mean without a tap

## 4.4.0 - 2026-08-28

### Added
- **Extra rest per break** on Edit profile (0–10 min, default 0). Stock rest is 60 seconds. Extra applies to later workouts
- Per-exercise **lb / kg** on the live card (next to Gym/Travel). Enter kg; store and score in lbs
- **How hard** charts on Your performance and Admin Athletes
- Tap a **Week lock** or **Week performance** tile for the helper copy

### Changed
- House / Home / badges / recap **Total weight** counts **completed sets only** (lb × reps; plank/carry = load once). Optional still sits on top
- Pack chart draws every calendar day. Rest days are 0 (daily) or held total (cumulative)
- Vs the house ranks are unique. No tied for first
- Optional stretch/core overlay: full-screen, **Done** pinned at the bottom (warmup and cooldown)

### Fixed
- Typing a weight no longer saves a half-typed row. Complete (or edit a finished set) is what writes. Finish deletes unfinished drafts
- Ghost unfinished sets on already-finished days were rebuilt from the real lifts (Christine, Kevin, Mike). Daily stats rebuilt
- Stretch/core Optional: Done was off-screen under the live header. Circuit stills that 404’d were swapped

## 4.3.0 - 2026-08-28

### Added
- **Invite a friend.** Home text link under Start/Select (same weight as Restart) and a hamburger item. Full name + email. They get mail, open the claim link, create a 4-digit PIN, then show on `/who` and the house board. Cap 100. Duplicate email or full name blocked. Resend from the sheet while they are Waiting. Test cannot invite

### Fixed
- Invite sheet opens full-screen on the phone (was clipped inside the header)
- Hamburger **Invite a friend** stays on screen on the phone: Edit / Invite / Switch sit pinned at the bottom; the rest of the menu scrolls

## 4.2.0 - 2026-08-27

### Added
- Rest overlay **Progress** (`completed / total` sets) between the rest clock and Skip. Darker glass so it reads over the cards

### Changed
- Phone live header: Exit, Restart, clock, sound across one row. Week title + focus centered under it. Desktop header stays the three-column layout
- **Finish it** sits at the end of the live session on phone (after cooldown). Desktop still has it in the header
- Sticky totals under the title: **Today** / All-time, tighter type and padding (was This workout)

## 4.1.0 - 2026-08-26

### Added
- Live workout **This workout / All-time** bar under the header. This workout = completed-set lbs (+ optional +500 when warmup/cooldown is done) and reps (timed/distance skipped). All-time = prior total excluding this session, plus live lbs
- **Week performance** under the Home week lock. Same 4-tile chrome: More load, More reps, Less drop, Less cut. This program week vs last time those lifts were done. Dashed **—** = first pass
- Per-exercise **Gym / Travel** on the live session. Select Workout still sets the session default. Each movement can flip until you complete a set on it, then that pill locks. Name, notes, stills, and video swap with the mode
- Completed log **week** headers show `lbs · reps · time` for the week (open or closed). Gold check when all 4 required days are done
- Completed session cards (log + Select finished days): gold check, `lbs · reps · time`, Gym/Travel, date, set count, Best day

### Changed
- Home and **The house** scan cards use the larger 50+ type. Home section stack is tighter
- **Your performance** (Home fold, menu, `/performance`) is on for every athlete, including Test. You vs leader and household averages still exclude Test
- Live session starts from the gym program names; travel is a per-lift overlay, not a whole-day rewrite

### Fixed
- Travel stills: **Bodyweight Single-Leg RDLs** (one-leg hinge) and **Lying Hamstring Floor Slides** (towel slides). Old RDL URL 404’d; floor slides were a gym curl machine

## 4.0.0 - 2026-08-26

### Added
- **Home Quiet.** Header is logo + menu only. Hero is today’s session: gold **Start** / **Resume**, outlined **Select**, Restart as a small text link. One sentence under it (`X of 24 days. Y lb all-time` plus last-7 when it differs)
- **Week lock** on Home: four required days. Solid gold + check = Done. Gold outline = Now (first unpaid required day). Dashed empty = still open
- **Daily weight** on Home: gold is you, copper dashed is house avg. Daily / Cumulative. 7 / 30 / All. Days with no lift stay off the chart
- **You vs the leader** scan on Home (hidden for Test)
- Bonus + Optional as a **flag strip**, not glass cards. Hidden when empty
- Menu rooms: **Your performance** `/performance`, **The house** `/scoreboard`, **Completed log** `/history`, **Medals** `/medals`, **About program** `/about`. Scoreboard route is still `/scoreboard`
- **The house** pack chart: every athlete as a line, gold = you, copper dashed house avg (Test left out of the avg). Daily / Cumulative. Empty days stay off
- About: 4-day Upper / Lower tiles (Wed Rest dimmer), bonus card, progressive overload

### Changed
- Home no longer stacks Scoreboard, Vs the house boards, Achievements, or the completed log. Those live in the menu. Folded **Your performance** and **You / house** stay on Home (Your performance hidden for Test)
- Home paints Start after `/api/me` + `/api/sessions`. Numbers fill in after. Sentence reads “Loading your numbers...” until stats land
- `GET /api/stats?home=1` skips unused weekly/timing queries
- Charts skip empty days and missing people. Tooltip only lists real weight

### Fixed
- Home and The house charts no longer plot `null` / `0` for days nobody lifted
- Analytics Sessions + page views and Cumulative skip empty days. Tooltips skip empty series
- Analytics **Athletes** (Kevin-only): compact By lift / By athlete table — weight lead and reps lead (or lifts led). Tap a row for the six KPIs / vs-last-time board. `GET /api/athlete-performance?household=1`

## 3.8.0 - 2026-08-25

### Added
- **Your performance** on Home, under Vs the house (starts folded). You vs last time you did that lift / that program day. 15 / 30 / All. Summary, By exercise, and By workout start folded. Each row: spike, heaviest set, total, % change, progression. Hidden for Test
- **How hard** 1–5 (Easy–Max) on a finished set after it folds. Skip it. Locked once you tap. Coach talks back

### Changed
- Set 1 prefills the heaviest set (weight + those reps) from the last completed session that had that movement. Sets 2+ stay empty until you finish the previous set, then that load copies forward. Last-time chip shows that heaviest set. Same on timed, bodyweight, distance, extras, and Do Again
- Gain/loss takeover: weight up (any reps) or same weight with more reps = good. Same or lower weight with fewer reps = bad. Same load, or weight down with reps up, stays quiet. A new all-time weight still shows the PR flash first

### Fixed
- Optional warmup/cooldown missing on iPhone after a hard refresh. They are on the live session now
- PR flash no longer resets itself while the rest timer is running

## 3.7.0 - 2026-08-24

### Added
- **Optional** warmup and cooldown on every live session (gym, travel, Bonus Upper). Easy run, Easy bike, Easy stretch, Easy core. +500 lb per slot
- Stretch and core: five holds with stills, video, and **Done**. Last Done credits without waiting out the 10-minute clock
- Home Optional chip: this-week warmup/cooldown counts plus unique optional-week tally
- **Optionals** and **Optional Weeks** badges. Optionals unlocks on the first slot. Optional Weeks unlocks on the first week with 4 warmups and 4 cooldowns, then shows a live unique-week count
- Scoreboard **honor roll** for unique optional weeks (7 / 30 / All). Same section in Monday scoreboard mail. Test stays off it
- Finish takeover names the optional lbs when you did the extra minutes

### Changed
- Select Workout: locked weeks (4 finished sessions) start folded. An in-progress session opens that week. Otherwise the next unlocked week opens
- Run and bike still need the full 10 minutes. Stretch/core clock is a fallback if you stop mid-circuit
- Optional lbs count on Scoreboard volume, Vs the house Total weight, Home totals, recap, and weight badges. Best day stays lifts only
- First 4 warmups + 4 cooldowns in the 7-day board window: 25% of the remaining gap to the total-weight lead, once

## 3.6.0 - 2026-08-23

### Added
- **Bonus Upper** on weeks 3–6: optional fifth day. Shrugs, pulldowns or pullovers, skull crushers, hammer curls, reverse wrist curls, plus dead bugs (weeks 3–4) or side plank (weeks 5–6). Travel swaps for all six
- **Bonus Day** badge. Unlocks on the first bonus. Card shows a live unique-week count
- Scoreboard **honor roll** for unique bonus weeks (7 / 30 / All). Same section in Monday scoreboard mail. Test stays off it
- Home bonus flag + tally when the week has a bonus day. After the last bonus week, tally stays if you have a count
- Vs the house ranking: **Best day** (heaviest day per lift, added up) and **Total weight** (every set, weight × reps). Thousands as `4.1k`, no space. Same list in the scoreboard email
- Finish takeover thanks you when the session was bonus

### Changed
- Week lock and perfect week stay **4** sessions. Bonus is extra credit and can count as one of the four
- Home Start, Select next-up, and workout nudges skip bonus. An open bonus session still resumes
- Weeks 3–6 required days keep the same lift names. Sets, reps, and notes get harder
- Home week tally is `1/4`, not `1/5`. Leave a day between upper sessions is a hint, not a lock

## 3.5.0 - 2026-08-23

### Added
- **Vs the house** on Home (starts folded, under Scoreboard): two boards — best-day **weight** and best-day **reps**. Who you lead, who you are behind, who you sit with. 7 / 30 / All
- Same board on Admin → Analytics (starts folded). Follows the Analytics range
- Scoreboard email includes each athlete’s standing on both boards

### Changed
- Household “you / household” numbers include you. Test is out of household averages and Vs the house
- Timed holds and Farmer’s / distance count the weight once, not seconds or meters. Old daily chart days stay as they were
- Vs the house compares you to people in your pack (within 1 SD), not a blowout vs another class
- Copy is a sentence: “Mike leads on Hip Thrusts, closest Christine.” “Mike is behind Kevin on Calf Raises.”

### Fixed
- Home hamburger menu no longer clips off the left side of the phone (Select and Start sit to the right of the button)

## 3.4.0 - 2026-08-23

### Added
- Extra sets on an exercise (cap +5). Copies the last completed set. Remove an extra if you did not finish it
- Completed log on Home (starts folded). Open a week, then a workout, to see every logged set
- Select Workout: finished days use that same card (mode, date, actual time, set count, tap for set details). Small **Do Again** on the header
- Hip Thrusts + Glute Bridges video tabs. New Farmer's Carries video. Travel glute / farmer use the same tapes

### Changed
- Finished sets fold and go gray. Tap to unfold and edit (yellow **Editing**). **Complete Set** stays yellow
- Finished days on Select Workout show actual time, not Est.

### Fixed
- Dead Hip Thrust, Glute Bridge, and Farmer's Carry videos
- Opening a finished day no longer starts a blank in-progress session

## 3.3.1 - 2026-08-22

### Changed
- Admin hamburger: Analytics, Users, Feedback, Mail. `/admin` opens Analytics. Add stays on Users. No more pill pile in the phone header
- Release orders group by feature so a long day is readable
- Release mail includes the iPhone Safari Add to Home Screen steps from welcome

## 3.3.0 - 2026-08-22

### Added
- Home stat cards show **you / household**. Household is everyone else who finished a workout in the last 7 days. Hidden if you are the only one who showed up
- Last workout vs their last-session average. Longest session vs their single longest. Total time vs the average of their totals
- Daily weight chart: household average on your last 14 workout days (skip zeros). Weekly completion: household average days per program week
- Talk to me: gold speech tab on the right (hidden on the workout). Optional topic. Note emails Kevin
- Thumbs under each exercise’s photos. Down: broken video, image doesn’t match, something else (something else needs a written note). One vote per exercise this session
- Required 1–5 stars on Complete it and Quitter. Stay for More discards the score
- Enjoyment charts on Home (yours) and Admin → Feedback (household). Empty charts stay hidden. Email digest from that page

## 3.2.0 - 2026-08-22

### Added
- Kevin-only **Analytics** under Admin: who reported in, what they tapped, gym vs travel, sets, badges, mail actions
- Production tracking of household use (name and email on Kevin’s screen only; kervinapps.com dashboard stays anonymous)

## 3.1.0 - 2026-08-22

### Added
- Gym / Travel switch on Select Workout (any week, any day). Travel swaps the day for no-equipment hotel-room work with form photos, video, and notes
- `workout_sessions.workout_mode` (`gym` default). Home Start Workout always starts Gym
- Scoreboard rows now show workouts, volume, sets, heaviest lift, best day, average time, medals, last workout, plus a Master Tom Iron line
- Select Workout next to Start / Resume (header and hero)

### Changed
- Week 2 is a normal gym week. No Travel Week label
- Travel Survivor: finish 4 travel-mode sessions (not Week 2)
- Trap Bar / Conventional Deadlifts form video
- Coach voices and rest / exit / complete lines load from `coach_voices` + `coach_lines`. Edit profile shows the tone description. Code banks are fallback only
- Badges stay once each. No repeat counts

### Removed
- Week-locked hotel-dumbbell travel list

### Fixed
- Edit profile on iPhone: sheet portals over the full screen so it is no longer trapped in the sticky header

## 3.0.0 - 2026-08-22

### Added
- Home scoreboard card (folded, above Weekly Progress): last 7 days, 30 days, or all time. Only people who finished a workout in that window
- 20 more badges. Medal SVGs instead of emoji. Finish screen taps through new badges, then the completion line
- Two form videos on Hanging Knee / Leg Raises and Ab Wheel Rollouts. New Face Pulls video

### Changed
- Coach names: **Master Tom Iron** and **Luna Meadows** (edit profile, mail From, sign-off, lines)
- `workit.kervinapps.com/` goes to `/who` if you are logged out, `/home` if you are logged in
- Achievements on Home stay at the bottom and start folded
- Last workout’s weight and reps prefill every set for that person, not only set 1
- Rest lines: ~16 per phase per voice; shuffle plays the whole bank before a repeat
- Edit profile sheet scrolls on a phone

### Fixed
- Workout chimes and horn actually play (sound files + unlock on tap + Finish chime on the confirm tap)

## 2.0.1 - 2026-08-19

### Changed
- Live app is `workit.kervinapps.com` (not `work-it.kervinapps.com`)
- Household mail buttons open `/who` (pick name, PIN). Monday scoreboard still opens `/admin`

## 2.0.0 - 2026-08-19

First version shared with household users.

### Added
- Household mail from **Master Workit**: welcome (incl. iPhone Add to Home Screen), get-to-it / finish-it nudges, workout recap, badge, Monday scoreboard, release notes
- Admin **Mail** (`/admin/mail`): preview templates, send a sample, run today's nudges, send live scoreboard
- Netlify scheduled function `workit-mail-cron` (`0 12 * * *` UTC) → `POST /api/cron/mail` with `CRON_SECRET`
- Welcome headline includes **- by invitation only** (same size as "You're mine now")
- Household profiles with PIN login and editable user details
- Kevin-only Admin page for household user CRUD
- Coach takeovers, rest/complete sounds, and timed-set timer

### Changed
- Coach / mail honorific is **Master Workit**; "boy" is **man**
- Mail cron and site env live on **Netlify**, not Vercel
- `/document` always mails household users a Master Workit release note (`npm run mail:release`)

### Fixed
- First-time PIN setup when `has_pin` is a string zero
- Keep the admin menu above the dashboard hero on iPhone
