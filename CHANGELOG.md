# Changelog

## Unreleased

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
