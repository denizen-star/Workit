# Feature Implementation Plan — Your Pick (replaces the Bonus Day)

**Overall Progress:** `100%`

## TLDR

Remove the optional bonus day (Bonus Upper in weeks 3–6, Bonus Core in week 7+, and the class/run picker) and replace it with **Your pick**. In any week of the main program, an athlete can choose an **Upper, Lower, Yoga, Core or Full body** workout, either as an extra or as a swap for a program day they haven't started. Every Your pick session counts toward the week lock, belts, badges and medals.

Yoga and Core have little or no logged weight. They earn credit equal to the athlete's average session volume over the last 7 days, scaled by effort. The house boards and weekly medals change from ranking by session count to ranking by **average volume per session**, behind an eligibility bar.

Every exercise in every workout also gets a **Push / Pull / Legs / Core** pill.

## Critical Decisions

- **Replaces the bonus day, main program only.** Bonus days come out of `lib/workoutData.ts` and `lib/yearProgram.ts`, and `BonusPickModal` is removed. **No completed session is deleted.** The old bonus content moves to a legacy lookup so past sessions still render and count, and an open bonus session can still be finished. Your pick is hidden while Hyrox is active.
- **Five types, rotating by week, carrying the phase note.**
  - Upper reuses the 8 `EXTRA_UPPER_PACKS`.
  - Full body grows from 3 to 5 packs.
  - Lower gets about 6 new packs and Core about 5, all built from movements already in the program.
  - Yoga is a new 30-minute session built from the existing optional-circuit poses plus new poses.
  - Weeks 1–6 carry the Settle note.
- **Session modes.** Upper, Lower and Full body are normal sets × reps with every live feature: optional warmup/cooldown, Alt, Gym/Travel, effort, PRs, the coach bubble and the recap email. Yoga and Core offer two modes:
  - **Timed tap-through:** each hold advances when its timer ends or when the athlete taps it complete.
  - **Mark done:** at least 30 minutes of wall clock, and at most one mark-done a day.
- **Swap or add.**
  - **Swap:** covers one program day that hasn't started. That tile reads done, and Home Start and nudges move past it.
  - **Add:** simply counts toward the week.
  - **Lock rule unchanged:** any N finished sessions lock the week.
  - **No per-day or per-week limit**, apart from mark done's once a day.
- **Week filing.** A Your pick is filed under the week being viewed. It's allowed only on the current week or earlier weeks that aren't locked yet, which blocks locking future weeks early for belts.
- **Five-day athletes.** Their 5th required day becomes a required Your pick, in weeks that used to have a bonus day. Weeks 1–2 stay at 4.
- **Bonus badge and honor roll.** Count weeks where a Your pick took completed sessions *beyond* the athlete's required count, plus all past bonus sessions.
- **Credit for Yoga and Core.**
  - **Amount:** the average finished lifting-session volume over the last 7 days. It excludes other credited sessions. If there's none, it falls back to the all-time average, then to a floor of 2,000 lb.
  - **Effort:** the credit is scaled by effort using the existing factor (0.8–1.2).
    - Yoga: one rating at the end.
    - Core, timed: holds tapped complete get their own rating, holds the timer advanced share one end rating, and credit uses the average of all of those.
    - Core, mark done: one rating at the end.
  - **Replaces Core's logged volume.**
  - **Where it counts:** display volume, the house ranking and weekly medals. Not Best day.
  - **Storage:** it's stored on the session, the same way the optional +500 lb is.
- **New ranking**, applied to the house 7d / 30d / all-time boards and to weekly medals.
  - **Eligibility bar:** 7d and weekly = your weekly day count. 30d = count × 4. All time = at least 1 locked week.
  - **Order:** eligible athletes first, then by average volume per session (including credit and effort). Athletes short of the bar rank below.
  - **Existing rows untouched:** `week_podium` rows already written stay as they are, and the rule applies to weeks closed from now on.
  - Test stays out.
- **Badges.** First Your pick, 10 Your picks, 25 Your picks, tried all 5 types, 10 yoga, 10 lower, and a week locked with a Your pick in it.
- **Push / Pull / Legs / Core pill.** A single name-keyed map. It's a label on the live card and in Select Workout, and a label plus a filter in the Library.
- **Identity.** The name is "Your pick", shown with its own gold SVG icon on cards, in the completed log and in emails.
- **Out of scope (parked):** logging an outside class or run, and making the boards fair between men and women.

## Tasks

- [x] 🟩 **Step 1: Schema**
  - [x] 🟩 `database/migrate-your-pick.sql`: add `workout_sessions` columns:
    - `pick_type` (`upper` / `lower` / `yoga` / `core` / `full`, NULL)
    - `pick_mode` (`sets` / `timed` / `done`, NULL)
    - `swap_for_day` (INT, NULL)
    - `credit_lbs` (DECIMAL, default 0)
    - `session_hardness` (TINYINT, NULL)
  - [x] 🟩 Insert the new badge rows (`INSERT IGNORE`).
  - [x] 🟩 Mirror the columns in `database/schema.sql`, Applied to PlanetScale 2026-09-24 via `scripts/apply-your-pick-migration.ts` (reads the `.sql` file), so no read fallback is needed.

- [x] 🟩 **Step 2: Content (`lib/yourPick.ts`)**
  - [x] 🟩 Pack pools: Upper (reuse), Lower (6 new), Core (5 new), Full body (move `FULL_BODY_PACKS` here and add 2 new), Yoga (a 30-minute pose list with start/end stills).
  - [x] 🟩 `yourPickDay(week, type)`: rotates by week and applies the phase note via `blockFor` (Settle for weeks 1–6).
  - [x] 🟩 Your pick day-number range, clear of 1–8 and Hyrox's 101+.
  - [x] 🟩 `resolveYourPickDay(week, day)` for session lookups, beside `resolveFullBodyDay`, at every `week.days.find` fallback.
  - [x] 🟩 Gold Your pick SVG icon component.
  - **Note:** Full body for 1–3 day athletes still uses only the original 3 packs (`FULL_BODY_PACKS`), so their rotation doesn't shift under open sessions. Your pick Full body uses those 3 plus 2 new.
  - **Note:** Yoga/Core flows live beside the existing pose data in `lib/optionalCircuits.ts` (`yourPickYogaFlow` 15 × 2 min, `yourPickCoreFlow` 12 × 75 s). `lib/resolveDay.ts` `resolveSessionDay()` replaces the four full-body-only fallbacks.

- [x] 🟩 **Step 3: Remove bonus days, keep history**
  - [x] 🟩 Drop `bonusUpper` and `bonusCore` from the built program, and move them to a legacy lookup used only to resolve past sessions.
  - [x] 🟩 `lib/bonusDay.ts`: `sessionIsBonus` and the SQL form still recognize legacy bonus sessions. Remove the program-flag paths that no longer apply.
  - [x] 🟩 `lib/scheduleDays.ts`: the 5-day required 5th slot becomes a Your pick slot. `athleteWeekDays` drops the tacked-on bonus.
  - [x] 🟩 Remove `BonusPickModal`, `BonusFlag` and the bonus copy in `app/workout/page.tsx` and `WeekLock`. Check that an open legacy bonus session still resumes and finishes.
  - **Note:** `workoutProgram` is still built *with* the bonus days through `applyAbCoreRotation` and stripped afterward, so every program day keeps the ab/core move it already had. `getLegacyBonusDay` / `getWorkoutDay` resolve past bonus sessions.
  - **Note:** `coveredDayNumbers()` in `lib/bonusDay.ts` is the single "is this tile done" rule (own day, swap target, Your pick slot). `lib/bonusActivity.ts` was dead after the picker removal and is deleted; the parked class/run feature will replace it.

- [x] 🟩 **Step 4: Start, swap and file rules (`POST /api/sessions`)**
  - [x] 🟩 Accept `pickType`, `pickMode` and optional `swapForDay`, and validate on the server:
    - The week is the current week or an earlier week that isn't locked.
    - Main track only, and not while Hyrox is active.
    - A swap target is an unstarted program day in that week.
  - [x] 🟩 A Your pick always creates a new session, never blocked by an earlier completed one of the same type. A second start while one is open returns the open one.
  - [x] 🟩 Completion runs the existing lock, badges, daily stats and recap path unchanged.
  - [x] 🟩 `lib/nextWorkout.ts` (`findNextProgramDay` / `getTodayTarget`) and the nudge emails treat a swapped day as done.
  - [x] 🟩 Mark done enforces 30 minutes of wall clock and one per Eastern day.
  - **Note:** Validation lives in `lib/yourPickStart.ts`; the week/swap rules (`yourPickWeekAllowed`, `yourPickSwapTargets`) are pure functions in `lib/yourPick.ts`, shared with the client sheet. "Current week" = the later of the first unlocked week and the latest week with any session.

- [x] 🟩 **Step 5: Picker UI**
  - [x] 🟩 `components/YourPickSheet.tsx`:
    - Pick a type, then choose "Add to week" or "Swap for <unstarted day>".
    - For Yoga and Core, also choose Timed or Mark done.
  - [x] 🟩 Entry points: an "Add a workout" row under each allowed week on Select Workout, and a Your pick button in the Home button row.
  - [x] 🟩 A swapped tile in `WeekLock` and on Select Workout shows done with the Your pick icon. Completed Your pick sessions show the icon and type in `CompletedSessionCard` and the completed log.
  - **Note:** Home's button is a compact gold "Pick" link (icon + label) beside Invite, linking to `/workout?yourPick=<week>`, which opens the sheet on Select Workout. Each week on Select Workout lists its open Your picks (Resume/Restart), finished ones, and any past bonus sessions, so nothing logged before disappears.

- [x] 🟩 **Step 6: Yoga and Core session flow**
  - [x] 🟩 Timed tap-through: reuse the optional-circuit hold overlay. A hold advances on its timer or on a tap; a tapped hold records its own effort.
  - [x] 🟩 Mark done: a clock, plus a Done button that unlocks at 30 minutes.
  - [x] 🟩 End-of-session "How hard?" rating, stored in `session_hardness` and required when any hold advanced on its timer, or in mark done.
  - [x] 🟩 Upper, Lower and Full body use the normal live session unchanged.
  - **Note:** `components/YourPickFlow.tsx` replaces the exercise cards (and warmup/cooldown cards) for Yoga/Core. Flow progress survives a reload via localStorage (convenience only); Finish stays disabled until `pickSessionHardness()` returns a value.

- [x] 🟩 **Step 7: Credit**
  - [x] 🟩 `lib/yourPickCredit.ts`: 7-day average of lifting sessions, with the all-time and 2,000 lb fallbacks, × the effort factor (the average of per-hold and end ratings).
  - [x] 🟩 Compute on Finish (the PUT) and store it in `credit_lbs`. Core's own set volume is excluded wherever `credit_lbs > 0`.
  - [x] 🟩 Add `credit_lbs` wherever optional lbs already flow (scoreboard display volume, Home, the recap, `daily_stats`, weight badges, the live Today bar). Best day stays out.
  - **Note:** `sqlSessionOptionalVolume` now includes `credit_lbs`, so credit reaches every total that already counted optional lbs. Best day uses the new `sqlSessionOptionalOnlyVolume` (scoreboard, week podium, exercise compare). **Deviation:** the live Today bar doesn't show credit during a Yoga/Core session, because credit is only calculated at Finish.

- [x] 🟩 **Step 8: Ranking by average per session**
  - [x] 🟩 A shared helper computes eligibility (weekly count / × 4 / at least 1 locked week) and the average volume per session, including credit and effort.
  - [x] 🟩 `lib/scoreboard.ts`: replace `ORDER BY workouts, volume` for the 7d, 30d and all-time boards. Update the "Next" logic in `YouVsLeader`.
  - [x] 🟩 `lib/weekPodium.ts`: use the same rule for weeks closed from now on. Base `missedTheWeek` on the athlete's weekly count.
  - [x] 🟩 Update copy wherever a rank is explained: the `?` help tips, `/help` and the scoreboard email.
  - **Note:** `lib/rankRule.ts` (`compareRank`) orders the scoreboard (7d/30d/all and the Your performance windows, where T/T-1 need 1 session and T-15 needs 2 weeks' worth) and `rankClosedWeek`. YouVsLeader's Next already follows server order, so it needed no change. Checked read-only against live data on 2026-09-24.

- [x] 🟩 **Step 9: Badges**
  - [x] 🟩 `lib/badges.ts`: the new requirement types, plus the Bonus Day and honor-roll count redefined as legacy bonus weeks together with weeks where a Your pick went beyond the required count (`lib/scoreboard.ts` honor roll too).
  - [x] 🟩 Badge art and copy for the new badges.
  - **Note:** `isBonusWeek()` (lib/bonusDay.ts) is the one rule; `lib/yourPickBonus.ts` applies it server-side per athlete's day count. Checked read-only: existing athletes' Bonus Day counts are unchanged. Badge art is in `public/badges/*.svg`, and the Bonus Day description now reads "Go past your week with a Your pick" (applied to PlanetScale).

- [x] 🟩 **Step 10: Push / Pull / Legs / Core pill**
  - [x] 🟩 `lib/movementPattern.ts`: name-keyed map covering every program, Your pick, travel and Alt name, plus a coverage script like `scripts/check-alt-travel-coverage.ts`.
  - [x] 🟩 `components/PatternPill.tsx` on the live `ExerciseTracker` card, the Select Workout exercise list and Library cards.
  - [x] 🟩 Library filter chip for the pattern.
  - **Note:** Select Workout's day cards show only an exercise count, so the pill appears on the exercise lists that page does show: its completed-session cards (shared with the completed log). Loaded carries are Core, and sled push and wall balls are Legs; cardio, conditioning and mobility get no pill. `scripts/check-movement-pattern-coverage.ts` passes (104 names).

- [x] 🟩 **Step 11: Docs**
  - [x] 🟩 `docs/WHAT_IS_WORKIT.md`, `app/help/page.tsx` and `CLAUDE.md` (bonus → Your pick, credit, ranking, pill, migration entry).

## Verification (2026-09-24)

- `tsc` clean; `npm run build` passes; lint adds no new errors (modified files' error counts match HEAD).
- API smoke test as **Test** against PlanetScale: future week and locked week rejected; second swap of the same day rejected; mark done can't finish before 30 minutes and only once a day; a timed Core swap for week 7 Upper A finished with `credit_lbs` 2,200 (floor 2,000 × 1.10 for How hard 4) and awarded "Your Pick". That session (id 264) stays on Test as QA data; the open yoga test session was reset.
- Read-only checks on live data: new ranking order is sensible; existing Bonus Day counts are unchanged.
- Not browser-tested yet: the picker sheet, Yoga/Core flow screens and Home **Pick** link.


## Follow-up (2026-09-24): Extra Upper → Your pick, count-first copy

- [x] 🟩 **Retire week 7+ Extra Upper.** It's stripped from `workoutProgram` like the bonus day. `programWithRetiredDays` keeps it for the Library, canonical reps and legacy lookups (`getRetiredDay`), and ab/core rotation is unchanged.
- [x] 🟩 **Your pick slots.** 4–5 day athletes' split is topped up to their count with Your pick tiles on day numbers 4 then 5 (`YOUR_PICK_SLOT_DAYS`). Week 7+: 3 program days + 1 (4 days) / + 2 (5 days). `weekCoverage()` fills slots with Your pick adds in order, and past Extra Upper / bonus sessions fill their own slot. Prod had no Extra Upper sessions yet.
- [x] 🟩 **Count-first copy.** Week labels read "N / M workouts", WeekLock "N of M workouts · Any mix locks it", with help copy, the join / Edit profile hint (`scheduleDaysHint`), `/help`, WHAT_IS_WORKIT, the scoreboard email and CLAUDE.md updated.
- [x] 🟩 **One-time explainer card** on Select Workout (`YourPickExplainer`, per-device localStorage flag).
- [x] 🟩 **Swap button** on every unstarted program day card, opening the sheet with that day pre-selected.
- Verified: `tsc`, build, lint counts unchanged, pattern coverage passes, and a script check of week shapes for 1–5 days across weeks 1/3/6/7/20.
