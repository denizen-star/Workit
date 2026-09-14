# Optional Yoga/Abs Tracks + Program Ab/Core Rotation — Implementation Plan

**Overall Progress:** `89%`

## TLDR
Two independent additions, combined into one plan since they were scoped together:
1. **Optional tracks**: add **Yoga** (fixed, level-less, tap-through pose sequence that varies by Upper/Lower day) and **Abs** (fixed, level-less, auto-advancing 45s-work/15s-rest interval circuit, identical in both slots) to the existing warmup/cooldown Optional picker, alongside Easy run / Easy bike / Stretch / Core.
2. **Program rotation**: starting at **week 4** through week 48, every eligible workout day (Upper A/B, Lower A/B, Bonus Upper, Extra Upper — not Bonus Core) gets exactly one ab/core exercise from a rotating 5-move pool, alternating between the start and end of the day, never repeating back-to-back.

Both are additive to existing data/UI patterns — no DB schema changes for either.

## Critical Decisions

**Optional Yoga/Abs tracks**
- No levels for either track — both skip the Easy/Medium/Hard picker and start immediately on tap, silently sending a default level (`'easy'`) to satisfy the existing API contract with zero backend changes.
- Yoga varies by Upper/Lower day; Abs does not (identical 5-exercise list in both slots).
- Yoga content: Upper-day sequence is user-supplied (Cat-Cow → Down Dog → Sun Salutation A Flow → Dynamic Low Lunge → Standing Forward Fold/Ragdoll; Child's Pose → Seated Forward Fold → Reclining Pigeon → Supine Spinal Twist → Legs-Up-the-Wall). Lower-day sequence is the approved draft (Low Lunge Flow → Down Dog/Low Lunge Flow → Wide-Leg Forward Fold → Standing Figure-Four → Chair Pose Pulses; Reclining Pigeon → Happy Baby → Seated Forward Fold → Supine Figure-Four Twist → Legs-Up-the-Wall).
- Yoga UI reuses the existing Stretch/Core tap-through pattern (hold countdown + "Done" button), just a flat 120s per pose instead of level-driven duration.
- Abs is a new, separate track — existing `core` track/content untouched.
- Abs UI is fully automatic: 45s work countdown auto-transitions to a 15s rest countdown, auto-advances through all 10 intervals (5 exercises × 2 rounds), no manual "Done" tapping (adapts the existing `SetRestTimer` countdown pattern). Exit (X) still available.
- Media: reuse already-vetted `free-exercise-db`/YouTube ids already in the codebase wherever a pose/exercise overlaps; web-search verified media for everything new; ship text-only for anything without a solid match. No fabricated video IDs.
- No DB migration needed — `warmup_track`/`cooldown_track`/`*_level` are plain `VARCHAR`.

**Program Ab/Core Rotation**
- Starts at week 4 — weeks 1-3 are untouched, keeping their original hard-coded ab/core moves.
- Pool (existing program moves, fixed order): Plank Hold, Pallof Press, Dead Bugs, Hanging Knee Raises or Ab Wheel Rollouts, Side Plank — all already first-class exercises, no new media/catalog/KPI work.
- Fixed sets/reps per pool move (no week-based progression): Plank Hold 3×60s, Pallof Press 3×15/side, Dead Bugs 3×8/side, Hanging Knee Raises or Ab Wheel Rollouts 3×12-15, Side Plank 3×45s.
- Eligible days (week ≥ 4): Upper A, Lower A, Upper B, Lower B, Bonus Upper, Extra Upper. Bonus Core excluded (already all 4 pool moves).
- One global sequence: a single counter starts at week 4's first eligible day and advances once per eligible day through week 48, driving both which pool exercise is used (`pool[i % 5]`) and placement (`i % 2 === 0` → end, odd → start).
- Always exactly one ab/core move per eligible day: any existing ab/core move is removed first (wherever it sits), then the rotated exercise is inserted at the determined placement. Days with no existing ab/core move (Lower B, Extra Upper's first pack) simply gain the rotated exercise.
- Implementation shape: a single pure post-processing function walks the already-built `workoutProgram` array once — no hand-editing of `lib/workoutData.ts`'s hand-authored weeks or `lib/yearProgram.ts`'s generated weeks.

## Tasks:

### Part 1 — Optional Yoga & Abs tracks

- [x] 🟩 **Step 1: Extend the track model (`lib/optionals.ts`)**
  - [x] 🟩 Add `'yoga'` and `'abs'` to the `OptionalTrack` union and `TRACKS` array
  - [x] 🟩 Add labels: `Yoga`, `Abs`
  - [x] 🟩 Introduce `needsLevelPicker(track)` (true only for `stretch`/`core`) so the level-select screen doesn't show for Yoga/Abs
  - [x] 🟩 Extend the guided/completion-path check to cover `yoga` and `abs`, so `circuitComplete` crediting works for both
  - [x] 🟩 Add `isIntervalOptionalTrack(track)` (true only for `abs`) to select the auto-advancing UI branch
  - [x] 🟩 Extend `optionalCircuit()` dispatch to route `yoga` and `abs` to their new builders

- [x] 🟩 **Step 2: Yoga content (`lib/optionalCircuits.ts`)**
  - [x] 🟩 Add `YOGA_WARMUP_UPPER` / `YOGA_COOLDOWN_UPPER` (user-supplied 5+5)
  - [x] 🟩 Add `YOGA_WARMUP_LOWER` / `YOGA_COOLDOWN_LOWER` (approved draft 5+5)
  - [x] 🟩 Add `guidedYogaCircuit(slot, region)` returning steps at a flat 120s hold each (no level parameter)
  - [x] 🟩 Wire into `optionalCircuit()` (region resolved via existing `optionalRegionFromDay`)

- [x] 🟩 **Step 3: Abs content (`lib/optionalCircuits.ts`)**
  - [x] 🟩 Add `ABS_EXERCISES` (Forearm Plank, Bicycle Crunches, Dead Bugs, Russian Twists, Reverse Crunches)
  - [x] 🟩 Add `absCircuit()` building the 10-step work sequence (5 exercises × 2 rounds), each step's work length = 45s; identical for both slots
  - [x] 🟩 Add a shared `ABS_REST_SECONDS = 15` constant for the UI's inter-step rest countdown

- [x] 🟩 **Step 4: Source real media**
  - [x] 🟩 Reuse existing vetted ids/videos already in the codebase for overlapping poses/exercises (Cat-Cow, Down Dog, Low Lunge, Child's Pose, Reclining Pigeon, Supine Twist, Seated Forward Fold, Dead Bugs, Russian Twist)
  - [x] 🟩 Web-search verified YouTube IDs for new poses/exercises (Sun Salutation A, Ragdoll Fold, Legs-Up-the-Wall, Wide-Leg Fold, Standing Figure-Four, Chair Pose, Forearm Plank, Bicycle Crunches, Reverse Crunches)
  - [x] 🟩 No `free-exercise-db` stills exist for the newly-sourced poses, so those ship video-only (no start/end stills) — reused-id poses keep their stills

- [x] 🟩 **Step 5: Picker & start flow (`components/OptionalCard.tsx`)**
  - [x] 🟩 Confirm `optionalTracks()` renders the 2 new buttons in the existing picker grid (6 tracks total)
  - [x] 🟩 Update `pickTrack()`: Stretch/Core keep the level-picker screen; Yoga/Abs call `startTrack(track, 'easy')` directly

- [x] 🟩 **Step 6: Yoga runtime UI (`components/OptionalCard.tsx`)**
  - [x] 🟩 Confirm the existing tap-through guided rendering (title/body/video/stills/"Done") works unmodified with the new flat 120s holds

- [x] 🟩 **Step 7: Abs runtime UI (`components/OptionalCard.tsx`)**
  - [x] 🟩 New rendering branch for `isIntervalOptionalTrack`: current exercise + 45s work countdown
  - [x] 🟩 Auto-transition to a 15s rest countdown (previewing the next exercise) on work-phase completion
  - [x] 🟩 Auto-advance `stepIndex` when rest ends; after the 10th work interval, set `circuitDone` and call `finishSlot(true)`
  - [x] 🟩 Reuse existing video-thumbnail/still rendering per exercise where media exists; no manual "Done" button in this branch

- [ ] 🟨 **Step 8: Manual verification**
  - [x] 🟩 `npx tsc --noEmit` and `npm run build` both pass clean with the new tracks wired in
  - [ ] 🟥 As Test user: run Yoga warmup + cooldown on an Upper day and a Lower day; confirm correct pose lists, 120s countdowns, +500 lb credit — needs a human pass in the browser
  - [ ] 🟥 Run Abs on warmup and cooldown; confirm 45/15 auto-advance through all 10 intervals, +500 lb credit — needs a human pass in the browser
  - [ ] 🟥 Confirm existing Easy run / Easy bike / Stretch / Core tracks are unaffected — needs a human pass in the browser

### Part 2 — Program Ab/Core Rotation

- [x] 🟩 **Step 9: Rotation helper (new `lib/abCoreRotation.ts`)**
  - [x] 🟩 Define `AB_CORE_POOL: Exercise[]` (the 5 fixed exercises/specs above)
  - [x] 🟩 Define `AB_CORE_NAMES` (name lookup for stripping an existing pool move out of a day)
  - [x] 🟩 Write `applyAbCoreRotation(weeks: WeekPlan[]): WeekPlan[]`:
    - [x] 🟩 Walk weeks in order, days within each week in `dayNumber` order
    - [x] 🟩 Skip every day in weeks 1-3 untouched (no counter movement, no changes)
    - [x] 🟩 Skip any day named `Bonus Core`
    - [x] 🟩 For each remaining day (week ≥ 4): increment the global counter `i`; compute `exercise = AB_CORE_POOL[i % 5]` and `placement = i % 2 === 0 ? 'end' : 'start'`
    - [x] 🟩 Remove any existing exercise whose name matches `AB_CORE_NAMES` from that day's `exercises`
    - [x] 🟩 Insert `exercise` at `placement` (unshift for `start`, push for `end`)

- [x] 🟩 **Step 10: Wire it in (`lib/workoutData.ts`)**
  - [x] 🟩 Wrap the existing `workoutProgram` construction: `export const workoutProgram: WeekPlan[] = applyAbCoreRotation([...FIRST_SIX, ...buildYearWeeks(FIRST_SIX)]);`
  - [x] 🟩 No changes needed to `FIRST_SIX`, `bonusUpper()`, or `lib/yearProgram.ts` — the transform runs after both are built

- [ ] 🟨 **Step 11: Verification**
  - [x] 🟩 Spot-check the rotation sequence end-to-end via script (pool cycles 5-deep with no immediate repeats, alternates start/end every day, every eligible day has exactly one ab/core move — 183 eligible days, weeks 4-48)
  - [x] 🟩 Confirmed weeks 1-3 keep exactly their original ab/core move (Lower Body B correctly has none, matching pre-existing behavior)
  - [x] 🟩 Confirmed Bonus Core is untouched (still its original 4 moves) every week
  - [x] 🟩 `npx tsc --noEmit` and `npm run build` both pass clean
  - [ ] 🟥 Manual click-through in the running app (Select Workout / live session) — not done in this session; needs a human pass in the browser
