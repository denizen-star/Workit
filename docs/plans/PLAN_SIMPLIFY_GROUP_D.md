# Simplify — Group D + remaining speed items

**Overall Progress:** `100%`

## TLDR
These are the structural refactors left over from the 2026-10-08 `/simplify` review (Groups A–C already shipped), plus the smaller speed items that weren't done. The goal is to stop special cases piling up for each program track (main / Hyrox / Overload) and to cut the remaining sequential database round trips. Athletes should see no change, except the two fixes called out in Step 4.

## Critical Decisions
- **Speed items first:** each one is small and independent, so they ship before the refactors and lower the risk of the later steps.
- **Derive the track from the week number band (`programTrackForWeek`), with no `locked_weeks` migration:** the band already identifies the track, so a new column would duplicate it.
- **Hyrox weeks stay out of `locked_weeks`:** this keeps today's behavior. The shared week-lock routine just asks the track whether it records locks.
- **The takeover queue changes Home's ordering only, not the "seen" storage:** the existing seen columns and tables stay as they are, so there's no migration.
- **One step per area, behavior-preserving, with one typecheck per step and one API check as Test** (the minimal verification rule).

## Tasks:

- [x] 🟩 **Step 1: Remaining speed items**
  - [x] 🟩 Scoreboard: replace the per-athlete `athletePerformance` call in `lib/houseTracking.ts` with one house-scoped set query, reusing the same fold code
  - [x] 🟩 `lib/athletePerformance.ts`: replace the per-row `session_ratings` subquery with a LEFT JOIN on ratings aggregated per session
  - [x] 🟩 `GET /api/sessions`: derive the locked-week count from `lockedWeekRecords().length`, run the `history=1` reads with `Promise.all`, and stop the workout page refetching `history=1` after a start or restart
  - [x] 🟩 Finish PUT: run `refreshSkippedHeavy`, `updateDailyStats`, the all-sessions read and `sessionBodyWeightNote` in parallel where they don't depend on each other; batch the reads in `sendWorkoutCompleteBundle` the same way
  - [x] 🟩 Scoreboard email and daily nudges: replace the per-user query loops with grouped queries
  - [x] 🟩 `/api/week-podium` route: parallelize its seen/mark reads
  - [x] 🟩 `PATCH /api/me`: replace the 6 separate UPDATEs with one statement
  - [x] 🟩 Home: stop calling `/api/me` twice (Home page + `AppMenu`) by sharing one in-flight request

- [x] 🟩 **Step 2: One day resolver (D4)**
  - [x] 🟩 `resolveSessionDay` routes by `programTrackForWeek` (absorbing `resolveAnySessionDay`)
  - [x] 🟩 Replace the `week.days.find(...) ?? resolveSessionDay(...)` fallbacks in `app/workout/page.tsx`, `lib/nextWorkout.ts` and `lib/bonusDay.ts`

- [x] 🟩 **Step 3: Per-track descriptor (D1 groundwork)**
  - [x] 🟩 Add `TRACKS` in `lib/programTrack.ts`. Each entry has `program`, `requiredDays`, `displayWeek` / `rawWeek` and capability flags (`locksWeeks`, `yourPick`, `editExercises`, `aimBox`, `testDrive`)
  - [x] 🟩 Replace the track ternaries in `app/workout/page.tsx`, `lib/scheduleDays.ts`, `components/ExerciseTracker.tsx`, `lib/exerciseEdits.ts` and `lib/lockedWeeks.ts`
  - [x] 🟩 Hyrox API returns `weekNumber` the same way Overload does, which removes `today.week + 100` in `HyroxHome`
  - [x] 🟩 Make the required count a mandatory argument (drop the `= REQUIRED_DAYS_TO_LOCK`, `?? 4` and `|| 4` defaults)

- [x] 🟩 **Step 4: One week-lock routine (D2)**
  - [x] 🟩 Add `refreshWeekLock(userId, weekNumber) → { locked, earnedBelt }` in `lib/lockedWeeks.ts`, with one session column list (`SESSION_WEEK_COLUMNS`)
  - [x] 🟩 Use it from the mark-complete POST, the Finish PUT and `lib/skippedSetsServer.ts`
  - [x] 🟩 Fix: the recap email's 48-week check counts main-track weeks only, not Overload weeks

- [x] 🟩 **Step 5: One athlete position (D3)**
  - [x] 🟩 Add `athleteProgramPosition(user, sessions)`. It applies the track filter, the resume floor, the schedule days, Test Drive and the weekend hold
  - [x] 🟩 Use it from Home (via `GET /api/sessions`), nudge mail, push reminders, the recap email and the Hyrox and Overload start snapshots
  - [x] 🟩 Fix: nudges, pushes and the recap's "next" line respect the resume floor after an athlete leaves Hyrox or Overload, and the two start snapshots use the same floor

- [x] 🟩 **Step 6: More programs as one family (D1)**
  - [x] 🟩 One `ProgramIntroTakeover` and one `ProgramTrackHome` shell, each configured per track
  - [x] 🟩 Home: one `activeIntro`, one `startProgram(track)` and one `?program=` handoff (keep `?hyrox=1` and `?overload=1` working)
  - [x] 🟩 `AppMenu`: `activeProgram` + `onLeaveProgram` in place of the per-track props
  - [x] 🟩 Shared `start` / `drop` / `bannerSeen` server helpers used by both API routes

- [x] 🟩 **Step 7: Home takeover queue (D5)**
  - [x] 🟩 A priority-ordered list of `{ key, due, render, markSeen }`; Home shows the first one that's due
  - [x] 🟩 Remove the ad-hoc guards (`if (weekTakeover || weekMissTakeover) return`) and the early return for the Overload diploma

- [x] 🟩 **Step 8: Finish flow state (D6)**
  - [x] 🟩 Replace the ~17 Finish `useState`s in `app/workout/page.tsx` with `finish: FinishResult | null` + `finishStep`
  - [x] 🟩 `leaveWorkout` resets everything with `setFinish(null)`

- [x] 🟩 **Step 9: Shared profile hook and header (D7)**
  - [x] 🟩 Add a `useMe()` hook returning a normalized `Profile`; use it in Home, the admin layout, `YouPageShell` and the workout page
  - [x] 🟩 One `PageHeader` shared by the admin layout and `YouPageShell`

- [x] 🟩 **Step 10: Tap-to-continue takeover shell (D8)**
  - [x] 🟩 Add a `TapTakeover` shell (Escape/Enter close, glow, avatar, eyebrow)
  - [x] 🟩 Use it in `WeekMissTakeover`, `WeekPodiumTakeover`, `WorkoutRecapTakeover`, `CompleteTakeover` and `AwardsTakeover`

- [x] 🟩 **Step 11: Docs**
  - [x] 🟩 Update CLAUDE.md wherever it names helpers that changed (resolver, week lock, More programs)
