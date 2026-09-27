# Feature Implementation Plan — Test Drive + Finish saving indicator

**Overall Progress:** `95%`

## TLDR
An athlete whose **first session isn't on an Eastern Monday** gets a **Test Drive**: a few fixed workouts they can do right away. Week 1 starts the following Monday. The number of workouts depends on the day of their first session:
- Tuesday: 3 (Full Body A → Upper A → Full Body B)
- Wednesday–Friday: 2 (Full Body A → Full Body B)
- Saturday or Sunday: 1 (Full Body A)

Test Drive sessions count toward the athlete's own stats. They stay off The house, the podium, You vs and rank, and never count toward Week 1, locking or belts. On Monday, unused Test Drive workouts disappear and an open one is deleted. Week 1 then opens with a takeover and a coach line.

Separately, **Complete it** gets a disabled "saving" state with timed captions. The same state covers the Yoga/Core Your pick Finish and the Hyrox milestone submit.

## Critical Decisions
- **Storage: `week_number = 0`, no migration.** Test Drive sessions are ordinary `workout_sessions` rows. Week 0 sits outside the program's 1–48 range and Hyrox's 101+ range, so locking, belts, `locked_weeks`, Select Workout week lists and `findNextProgramDay` ignore it without any change.
- **Days: `dayNumber` 30–32, resolved in `lib/testDrive.ts`.** These are hooked into `resolveSessionDay()` so Start, resume, the live render, the recap and the Completed log all pick them up. They reuse existing packs (`FULL_BODY_PACKS[0]`, `FULL_BODY_PACKS[1]`, week 1's own Upper Body A — the extra-upper pack is an accessory day marked "Lighter than A and B", wrong for a first workout), so no new exercise content is needed.
- **Test Drive state is derived, not stored.** `firstSessionAt` is the first session the athlete ever started. Test Drive is on if that session isn't on an Eastern Monday and today is before the Monday after it. A brand-new athlete with no sessions is eligible if today isn't Monday. The allotment comes from the weekday of the first session.
- **Scope: new joins only.** Only accounts created on or after the ship date are eligible, compared against a `TEST_DRIVE_SINCE` constant. That leaves existing athletes as they are.
- **Board exclusion: one shared SQL fragment.** `SQL_NOT_TEST_DRIVE` (`ws.week_number <> 0`) is added only to household/board queries: scoreboard, week podium, You vs / exercise-compare house side, and household average/rank inputs. Personal totals, Your performance, Daily weight, badges, set history and PRs keep counting Test Drive sessions, because leaving them in takes less code.
- **Monday cleanup: lazy, on read.** `GET /api/sessions` deletes the athlete's open week-0 sessions once Test Drive has ended. No cron is needed.
- **Monday takeover: shown once.** It reuses the `week_takeover_seen` dismissal table (week 1, kind `week1_start`).
- **Saving captions: for show only.** They are timed client-side on a single PUT, with no endpoint split. They start when the athlete taps and so cover the celebration wait. The flow jumps to the recap as soon as the save finishes. On an error, the button resets.
- **Confetti: CSS only**, a small keyframe burst in `globals.css`. No new library.

## Tasks:

- [x] 🟩 **Step 1: `lib/testDrive.ts` (core rules)**
  - [x] 🟩 `TEST_DRIVE_WEEK = 0`, `TEST_DRIVE_DAYS` (30–32), `TEST_DRIVE_SINCE`
  - [x] 🟩 `testDriveAllotment(firstSessionAt)`: Tue → 3, Wed–Fri → 2, Sat/Sun → 1, Mon → 0 (uses `lib/analyticsTime.ts` Eastern helpers)
  - [x] 🟩 `testDriveState(user, sessions, now)` → `{ active, firstMonday, days, doneCount, nextDay, allDone, daysUntilMonday }`
  - [x] 🟩 `resolveTestDriveDay(week, day)` builds the `WorkoutDay` from existing packs, named "Test Drive · Full Body A" and so on
  - [x] 🟩 Hook it into `resolveSessionDay()` in `lib/resolveDay.ts`

- [x] 🟩 **Step 2: Server — start, cleanup, exclusion**
  - [x] 🟩 `POST /api/sessions`: accept `weekNumber: 0` only while `testDriveState.active` and the day is within the allotment. Skip `recordWeekLockIfNeeded` and bonus/Your pick logic for week 0
  - [x] 🟩 `GET /api/sessions`: once Test Drive has ended, delete the athlete's open week-0 sessions and their sets. Return `testDrive` state in the payload
  - [x] 🟩 Add `SQL_NOT_TEST_DRIVE` to scoreboard, `lib/weekPodium.ts`, exercise-compare / You vs house queries and household avg / rank inputs
  - [x] 🟩 Finish PUT: week 0 runs the full flow (badges, recap email, Awards). Confirm belt/lock code returns nothing for week 0

- [x] 🟩 **Step 3: Home**
  - [x] 🟩 `getTodayTarget` / Home: while Test Drive is active, the hero shows "Test Drive · Full Body A" with **Start WO** launching the next Test Drive workout (resume works as today), plus a "Week 1 starts in N days" countdown ("Starts tomorrow" on Saturday, "Starts Monday" on Sunday)
  - [x] 🟩 All Test Drive workouts done, before Monday: a new hero state with a confetti burst, the countdown and a summary (workouts · lbs · time). No Start button
  - [x] 🟩 `QuickstartTakeover` shows on every Home open until Monday while Test Drive is active, with the countdown line added. The `quickstart_seen_at` gate stays for everyone else
  - [x] 🟩 First Home open on or after the first Monday: a "Week 1 starts now" takeover, once (`week_takeover_seen`, kind `week1_start`), with a coach line from a new code-bank `week1Start` entry per voice (`lib/coachLines.ts`)

- [x] 🟩 **Step 4: Select Workout + Completed log**
  - [x] 🟩 A "Test Drive" block at the top of Select Workout listing the allotted days. It uses the existing Start/Resume/`CompletedSessionCard` tiles and shows while Test Drive is active or has completed sessions
  - [x] 🟩 `startWorkout` / `getCurrentWorkout` resolve week 0 via `resolveSessionDay`
  - [x] 🟩 Completed log: a "Test Drive" group for week-0 sessions

- [x] 🟩 **Step 5: Mail**
  - [x] 🟩 Nudges (`lib/emails/nudge.ts`): skip athletes still before their first Monday, including new accounts with no sessions that weren't created on a Monday
  - [x] 🟩 Welcome + verify templates: one line saying "Week 1 starts Monday — start a Test Drive today"

- [x] 🟩 **Step 6: Finish saving indicator**
  - [x] 🟩 `Modal`: add optional `busy` + `busyLabel` props (disable both buttons, show a spinner and the caption)
  - [x] 🟩 `completeWorkout`: set `saving` on tap, before `awaitPendingCelebration`. Cycle the captions "Saving…" → "Calculating…" → "Checking…" on a timer. Clear on success (straight to the recap) or on error. Guard against re-entry
  - [x] 🟩 Use the same captions on the Yoga/Core Your pick Finish path and the `HyroxMilestoneTakeover` submit button

- [ ] 🟨 **Step 7: Docs + verify**
  - [x] 🟩 Update `docs/WHAT_IS_WORKIT.md`, `app/help/page.tsx` (Program section) and `CLAUDE.md` with the Test Drive rules
  - [x] 🟩 `npm run lint` + `npm run build` (`next lint` is gone in this Next version; ran `npx eslint` on every touched file — no new errors vs HEAD — and `npm run build` passes)
  - [ ] 🟨 Date rules unit-checked with `npx tsx` (allotment per weekday, Sun 23:59 → Mon 00:01 ET cutoff, countdown, program-first and old accounts → none). Browser pass still to do: check as Test that the existing flow is unchanged: a Monday start, and an athlete who already has sessions, see no Test Drive. Week lock, belts, the podium and You vs numbers stay the same
