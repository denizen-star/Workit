# Feature Implementation Plan — Alt Exercise Swap

**Overall Progress:** `100%`

## TLDR

Let an athlete swap any main-program or Hyrox exercise card for a same-muscle-group alternative mid-workout, via a takeover picker showing a curated shortlist with anatomical muscle-group diagrams (gym-placard style) — a per-session convenience, not a saved preference. This supersedes the toggle-only UI decision in `docs/plans/PLAN_GOAL_PROGRAMS_AND_ALT_EXERCISES.md` (that doc's Goal Programs half is untouched and stays separate/unbuilt).

## Critical Decisions

- **UI shape**: A takeover/modal picker (patterned on `components/BonusPickModal.tsx`), not a toggle — supersedes the original plan doc's "toggle, not picker" call.
- **Scope**: Main program + Hyrox exercise cards only (both use `ExerciseTracker`'s card pattern). Optional Stretch/Core/Yoga/Abs circuits are **out of scope** — different fixed-sequence UI (`components/OptionalCard.tsx`), no per-movement card to hang a control on. Deferred to a future plan.
- **Alt list**: A small hand-curated shortlist (3-5 alternatives) per exercise — not a full same-muscle-group browse of the whole catalog.
- **Muscle-group taxonomy**: The 12-group system from the Movement Library artifact (Chest, Back, Shoulders, Arms, Core, Glutes, Quads, Hamstrings, Calves, Full Body, Cardio, Mobility) — a new permanent tagging table in `lib/`, separate from the existing coarse `lib/muscleGuess.ts` (which stays as-is for its own unrelated stat).
- **Muscle image**: A real anatomical body-diagram (silhouette with the target region highlighted, like gym equipment placards) per muscle group, sourced from a free/open-license diagram set — not the abstract glyph icons used in the artifact.
- **Alt + Gym/Travel interaction**: Picking an Alt replaces the whole movement; any existing Gym/Travel choice on that card resets (it's a new movement now).
- **Persistence**: Per-session only. Resets next time, same as Gym/Travel — no saved preference.
- **History/PR continuity**: No merge on swap. The alt tracks as its own exercise from the start, same as the existing documented gap in `lib/exerciseKey.ts` — no changes needed there.
- **Eligibility**: Open to everyone immediately — no locked-week gate (that gate is Goal Programs-only).
- **Content authorship**: Claude proposes a first-draft shortlist per exercise (same muscle group, sensible equipment/difficulty match, pulled from the 180-movement catalog); Kevin reviews/edits before it ships.
- **Vote gate**: Proceeding regardless of the pending athlete vote referenced in the bundled plan doc.

## Tasks:

- [x] 🟩 **Step 1: Muscle-group taxonomy in the codebase**
  - [x] 🟩 Add `lib/muscleGroups.ts`: the 12-group taxonomy plus a per-exercise-name tag map, keyed by the exact `Exercise.name` used in `lib/workoutData.ts`/`lib/hyroxProgram.ts` (the same identity `ExerciseTracker` already uses for Gym/Travel) — 47 unique program exercise names, all tagged
  - [x] 🟩 Leave `lib/muscleGuess.ts` untouched — different taxonomy, different consumer

- [x] 🟩 **Step 2: Anatomical muscle-group diagrams**
  - [x] 🟩 Sourced `body-muscles` (npm, Apache-2.0, zero runtime deps) — 70+ individually-pathed front/back muscle regions as raw SVG path data, not a live-fetched image, so no dead-link risk
  - [x] 🟩 Added `MUSCLE_GROUP_HIGHLIGHT_IDS` to `lib/muscleGroups.ts` (our 10 alt-eligible groups → its region ids) and built `components/MuscleDiagram.tsx` — front + back silhouette, target region filled gold, everything else neutral outline. Verified all 66 referenced ids exist in the library and previewed the render (Chest/Back/Quads/Glutes/Full Body all read correctly, gym-placard style)

- [x] 🟩 **Step 3: Curated alt-exercise shortlists**
  - [x] 🟩 Draft `lib/altExercises.ts`: exercise name → 3-5 alternative names for every main-program + Hyrox exercise, drawn from same-muscle-group entries already in the program (so every alt already has form photos, no new media needed). Cardio/Mobility/AMRAP entries intentionally have no list.
  - [x] 🟩 Flagged in the file header for Kevin's review — Glutes/Calves pools are thin (2-3 movements total) and some entries only have one real alternative

- [x] 🟩 **Step 4: Alt takeover component**
  - [x] 🟩 Built `components/AltExerciseTakeover.tsx` on the `BonusPickModal` pattern: fixed overlay, list of alternatives each showing name + `MuscleDiagram`, tap-to-select, dismiss control
  - [x] 🟩 Props: `open`, `exerciseName`, `muscleGroup`, `alternatives`, `onSelect(altName)`, `onClose` — parent-owned state, no network calls inside the component

- [x] 🟩 **Step 5: Wire into the exercise card**
  - [x] 🟩 Added `components/AltButton.tsx` (same pill styling/lock behavior as `ModeToggle`) to the existing pill row in `components/ExerciseTracker.tsx`, between `ModeToggle` and `UnitToggle` — hidden entirely when the exercise has no curated alt list (Cardio/Mobility/AMRAP)
  - [x] 🟩 Same lock rule as `ModeToggle`: `disabled` once any set on that card is completed (`locked`), whole row (Alt included) hidden once `exerciseFullyDone` — reused as-is, no new lock logic needed
  - [x] 🟩 `changeExerciseAlt()` renames not-yet-completed sets in local state and clears any existing Gym/Travel mode for that card, mirroring `changeExerciseMode()`. Fixed a latent bug this surfaced: `groupedSets`' set lookup was `setsForMovement(exerciseSets, gym.name)`, which only matches `lib/exerciseKey.ts` alias groups — an alt name is deliberately outside those groups, so it now unions the original identity with the active alt name

- [x] 🟩 **Step 6: Persist the swap server-side**
  - [x] 🟩 Added `workout_sessions.exercise_alts` (`database/migrate-exercise-alts.sql`, **not yet applied** — needs running on PlanetScale by hand before this works end-to-end) and `lib/exerciseAlts.ts` (parse/serialize, mirrors `lib/exerciseModes.ts`)
  - [x] 🟩 Extended the existing session PATCH handler (`app/api/sessions/route.ts`) to accept `exerciseAlts`, persist it, and bulk-rename uncompleted `exercise_sets` rows in the same loop `applyExerciseMode`'s rename already uses — alt name wins over mode when both are present
  - [x] 🟩 Found and fixed a related pre-existing gap while extending that loop: it only resolved the exercise day via `getWorkoutDay`/`resolveFullBodyDay` (main program), so Gym/Travel and Alt renames silently did nothing on Hyrox sessions (week 101+). Added the same `HYROX_WEEK_OFFSET` branch `POST /api/sessions` already uses
  - [x] 🟩 `GET /api/exercises` now also returns `exerciseAlts` alongside `exerciseModes`, read the same way client-side
  - [x] 🟩 Confirmed `POST /api/exercises`'s `exercise_name = COALESCE(?, exercise_name)` rename path needs no changes — it renames by whatever name is passed, alt or otherwise

- [x] 🟩 **Step 7: Verify**
  - [x] 🟩 Applied `database/migrate-exercise-alts.sql` to PlanetScale (confirmed by the user) so live verification was possible
  - [x] 🟩 As Test, in a real browser (Playwright driver, not a unit test): opened Alt on "Lat Pulldowns or Cable Rows", takeover showed the curated shortlist with front/back muscle diagrams, selected "Seated Cable Row" — card retitled immediately, zero console errors
  - [x] 🟩 Confirmed persistence: fresh page reload (new browser session) still shows "Seated Cable Row", and `workout_sessions.exercise_alts` in the DB holds `{"Lat Pulldowns or Cable Rows":"Seated Cable Row"}` — proves the server round-trip, not just React state
  - [x] 🟩 Found and fixed two real bugs this surfaced: (1) Gym/Travel stayed visible and interactive after an Alt swap even though it no longer applied to anything — now hidden whenever an alt is active; (2) three names introduced by `lib/altExercises.ts` ("Barbell Bench Press", "Barbell Rows", "Seated Cable Row") had no photo match in `lib/exerciseImages.ts`, so their cards silently showed no start/end photo — added real free-exercise-db entries for all three
  - [x] 🟩 Noted, not fixed (pre-existing, unrelated to this feature): 8 Hyrox-only exercise names (Leg Press, Wall Balls, Burpees, etc.) already had no photo match before this work — same gap, out of scope here
  - [x] 🟩 `tsc --noEmit` and `eslint` clean on every new/touched file throughout

## Follow-ups (not blocking, noted for later)

- No "revert to original" affordance in the Alt takeover once swapped — reopening it only offers a different alt from the shortlist, never the original movement back. Wasn't explicitly scoped; worth a small follow-up.
- 8 pre-existing Hyrox exercise names still have no start/end photo in the live app (dead `/api/exercise-image` DB-blob fallback, unpopulated `exercises` table) — unrelated to this feature, flagged for awareness.

## Amendment (post-review): Gym/Travel removed from the live card

During review, the per-card Gym/Travel toggle was found redundant with Alt — since travel-friendly movements can already be reached as an Alt swap, having both controls on the same card was confusing clutter. Scoped decision: remove Gym/Travel **only from the live exercise card** (Select Workout's day-level Gym/Travel pill, the dual video tabs, and travel-specific photo substitutions are untouched — they're a separate, much larger surface not part of this change). Replaced with a plane icon that flags travel-friendly movements wherever they appear.

- [x] 🟩 Removed `ModeToggle` and its `changeExerciseMode` handler from `components/ExerciseTracker.tsx`'s pill row — Gym/Travel mode resolution (`applyExerciseMode`, session-level `workout_mode` default) is untouched, only the per-card override control is gone
- [x] 🟩 Added `lib/travelFriendly.ts` (`isTravelFriendly()`) — unions `lib/travelExercises.ts`'s explicit travel-substitute names with a small hand-picked set of movements already equipment-free in their normal form (Plank Hold, Dead Bugs, Hanging Knee Raises)
- [x] 🟩 Added `components/PlaneIcon.tsx`, shown next to the exercise card title when the current exercise is travel-friendly, and next to each travel-friendly alternative in the Alt takeover (plus a "No gym equipment needed" legend line)
- [x] 🟩 Audited every `lib/altExercises.ts` shortlist (`scripts/check-alt-travel-coverage.ts`) and added a travel-friendly alternative to the 15 that had none, so the plane icon is reachable from every exercise, not just some
- [x] 🟩 Verified live: swapped card shows only `ALT` + `LB/KG` (no Gym/Travel), zero console errors, plane icons render correctly on travel-friendly alternatives in the takeover and are correctly absent on equipment-only ones
