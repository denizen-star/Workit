# Feature Implementation Plan — Focus Setup (Wizard, Menu, Weekly Focus)

**Overall Progress:** `98%`

## TLDR
Every athlete picks a **focus** (Build muscle · Gym / Core Inspired / Home · 2 Dumbbells / No equipment · Travel), a set of **weekdays**, and gets a 9am push reminder on those days. The weekday count replaces the fixed "4 workouts a week for 6 weeks" onboarding. Milestones (belts, More programs at 6 locked weeks) stay. Home's hero lets the athlete pick next week's focus. New content: two mat Pilates routines and two 2-dumbbell full-body days, ingested with the full exercise treatment.

## Critical Decisions
- **Focus is per athlete, per week, not a new track:** a focus changes which day pack fills the week; it is not a `TRACKS` entry like Hyrox/Overload. Keeps week lock, belts, podium, and Your pick on the main program's plumbing.
- **Weekdays are the source of truth for day count:** `schedule_days_per_week` is derived from the selected weekdays (min 1, max 5 per existing clamp), so the two can never disagree. Existing week-lock rules (`locked_weeks`, `requiredCountForWeek`) are reused unchanged, so locked weeks stay locked.
- **All focuses lock weeks and count toward belts** at the athlete's chosen day count (confirmed).
- **Build muscle = today's program, untouched.** Existing athletes get **Continue as is** and stay on it.
- **Reminders reuse the existing push system** (`reminder_days` / `reminder_time` / `reminders_on`); only the default time becomes 09:00 and the weekday picker moves into the wizard.
- **Pilates = a new timed flow** like Yoga/Core in `YourPickFlow` (5 / 10 / 10 / 5 min phases, no equipment, mat only). Dumbbell days = normal live sessions.
- **Focus is an optional param, default `build`:** `athleteRequiredDays` / `daysForWeekFn` / `requiredCountForWeek` gain an optional focus so ~37 existing call sites stay untouched; only the focus-aware paths (Home target, Select Workout, lock write, reminders) pass it.
- **Focus change applies from the next unstarted week;** it never rewrites sessions already done.
- **Rotations (proposed, Kevin reviews):**
  - Core Inspired: Pilates A → Yoga → Pilates B → Core, cycled by day count and week.
  - Home 2 Dumbbells: Full-Body 1 / Full-Body 2 alternating (A/B/A, then B/A/B), plus travel routines drafted from existing travel swaps.
  - Travel: bodyweight full-body days from existing travel swaps, plus Pilates and Core flows.

## Tasks:

- [ ] 🟨 **Step 1: Schema**
  - [x] 🟩 `database/migrate-focus.sql`: `users.focus` (default `build`), `users.focus_chosen_at`, per-week override table `week_focus` (user + week, PK)
  - [ ] 🟥 Apply with `scripts/apply-migration.ts` (re-run safe) — held until code is ready; needs Kevin's OK (shared prod DB)
  - [x] 🟩 Reminder default time 09:00 for new setups (`lib/reminderPrefs.ts`)

- [x] 🟩 **Step 2: Focus model (`lib/focus.ts`)**
  - [x] 🟩 Focus ids, neutral labels and descriptions, equipment note
  - [x] 🟩 `focusForWeek(default, overrides, week)`: week override, else athlete default
  - [x] 🟩 `scheduleDaysFromWeekdays` derives the count (sync into `schedule_days_per_week` happens in Step 5's API)

- [x] 🟩 **Step 3: Content ingest** (travel routines = existing `FULL_BODY_PACKS` through `toTravelExercise`, no new drafts needed; **parked for Kevin:** YouTube video ids for 9 new dumbbell moves + 4 Pilates moves, Alt shortlists and travel swaps for the 9 new moves)
  - [x] 🟩 Pilates A and B as flows in `lib/optionalCircuits.ts` (`pilatesFlow('a'|'b')`, 30 min each verified; reuses existing hold stills/videos; 4 moves in B have no stills and no video ids yet — needs Kevin's media curation)
  - [x] 🟩 Full-Body 1 and 2 (dumbbell) as packs in `lib/focusPacks.ts`; new movements get names, stills, video, How cue, Push/Pull/Legs/Core pill, muscle group, Alt shortlist, travel swap, Library entry
  - [x] 🟩 Home travel routines: the existing full-body packs in travel mode
  - [x] 🟩 `check-movement-pattern-coverage` passes; `check-alt-travel-coverage` fails on 3 older entries (Shrugs, Reverse Wrist Curls, Side Plank) unrelated to this work

- [x] 🟩 **Step 4: Week shaping** (`lib/focusRotation.ts`: positional slots, core 110-114 / home 120-124 / travel 130-134, so a session row's week + day always re-resolves)
  - [x] 🟩 `athleteRequiredDays` / `athleteWeekDays` / `daysForWeekFn` / `requiredCountForWeek` take an optional focus (default build, so existing callers are unchanged); `resolveSessionDay` resolves focus days
  - [x] 🟩 Flow days (Pilates, Yoga, Core) start through the Your pick path (`pickDay` = focus day number) and run in `YourPickFlow` (credit rules follow Yoga/Core)
  - [x] 🟩 Focus threaded through: lock write (`refreshWeekLock`), Home + Select Workout + WeekLock + Completed log (via `focusInfo` on the sessions payloads), nudges and the recap email's next line. Not threaded (still count the athlete's day count only): week-podium miss detection, badge/perfect-week SQL, Your pick bonus count — they differ from the focus count only for weeks 1-2 at 5 days

- [x] 🟩 **Step 5: API** (one new route, `app/api/focus/route.ts`, instead of widening `PATCH /api/me`)
  - [x] 🟩 `POST /api/focus` `setup` (focus + weekdays → derived day count + reminder days, 9am default), `continue`, `week` (refuses a week that already has a session); `GET` returns the current state
  - [x] 🟩 `focusInfo` rides on `GET /api/sessions` (+ history) and so on `GET /api/home`

- [x] 🟩 **Step 6: Wizard and menu**
  - [x] 🟩 `components/FocusSetupTakeover.tsx`: 4 focus buttons, M–S weekday buttons, 9am reminder checkbox (asks this device for notifications), **Continue as is**, "change your mind any time" note
  - [ ] 🟥 `/join`: **not done** — `/api/focus` needs a session, and `/join` is signed out. New athletes meet the same setup at first login instead (right after Quickstart). Adding it to the join wizard means passing focus + weekdays through `POST /api/join`
  - [x] 🟩 One-time Home takeover for everyone (`users.focus_chosen_at` gates it)
  - [x] 🟩 Menu: **Training focus** item reopens the same screen. The 6-week days ask is left as is

- [x] 🟩 **Step 7: Home hero**
  - [x] 🟩 `WeekFocusChip`: this week's focus if nothing in it has started, else next week's, with a sheet to change it
  - [x] 🟩 Start / Select Workout / nudges / recap next line read the focus's days

- [ ] 🟨 **Step 8: Docs and verification**
  - [x] 🟩 Updated `CLAUDE.md`, `docs/WHAT_IS_WORKIT.md`, and `/help` (focus, weekdays, Pilates)
  - [x] 🟩 Typecheck clean
  - [x] 🟩 `migrate-focus.sql` applied to PlanetScale (Kevin OK'd); `/api/focus` tested as Test (setup, week override, `focusInfo` on `GET /api/sessions`), Test restored to Build muscle
  - [ ] 🟥 First screenshot of the setup screen and Home chip: no browser tool was available this session

## Phase 2 (requested after the first build)

- [x] 🟩 **Step 9: More than one focus**
  - [x] 🟩 `migrate-focus-multi.sql`: widen `users.focus` and `week_focus.focus` to hold a list
  - [x] 🟩 `lib/focus.ts` / `lib/focusState.ts` / `/api/focus`: a list of focuses (default and per week)
  - [x] 🟩 `lib/focusRotation.ts` + `athleteRequiredDays`: a week alternates its days between the chosen focuses (the lead focus alternates by week; Build muscle slots use the real split days)
  - [x] 🟩 Setup screen and Home chip: multi-select
- [x] 🟩 **Step 10: Your pick offers every focus workout, with category filters**
  - [x] 🟩 Named, week-independent workouts (Pilates A/B, Home Full-Body 1/2, Travel Full Body A/B/C) on their own day numbers (140-146) so they can be picked in any allowed week
  - [x] 🟩 Category chips in the Your pick sheet (All, Upper, Lower, Full body, Core & other, Pilates, Home, Travel, Run)
- [x] 🟩 **Step 11: Library refresh**
  - [x] 🟩 Pilates section (both routines' moves), Home · 2 Dumbbells mode, travel full-body moves
- [x] 🟩 **Step 12: Docs and typecheck**

## Phase 3 (requested after phase 2)

- [x] 🟩 Home rotation: every day alternates Full-Body 1 / 2 (A/B/A at 3 days, A/B/A/B/A at 5, next week starts on B)
- [x] 🟩 Rest-day warning on the setup screen when a full-body focus lands on back-to-back days
- [x] 🟩 Videos wired in: all 7 dumbbell moves and all 11 Pilates moves
- [x] 🟩 New moves appear as Alt options on the lifts they replace, and each has its own shortlist
