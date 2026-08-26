# Changelog

## Unreleased

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
