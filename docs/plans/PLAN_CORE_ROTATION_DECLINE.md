# Feature Implementation Plan — Core Rotation + Decline Bench

**Overall Progress:** `95%`

## TLDR
Two program changes:
1. **Ab/core rotation.** The pool grows from 5 moves to 12, and the rotation is fixed. Right now every day lands on the same move week after week, and the start/end placement never changes.
2. **Lower chest.** **Decline Dumbbell Bench Press** replaces Incline Dumbbell Bench Press on **Upper B** from **week 7 onward**. Incline becomes its first Alt option.

## Critical Decisions
- **The new lower-chest move is Decline Dumbbell Bench Press**, at 8–10 reps in the same slot, with the incline's notes. It is the closest like-for-like swap for the incline.
- **Upper B in weeks 1–6 is unchanged.** Only `buildYearWeeks` (`lib/yearProgram.ts`) swaps the move.
- **The decline's history starts fresh.** It does not join the incline's group in `lib/exerciseKey.ts`, the same rule Alt moves already follow.
- **The pool has 12 moves:** Plank Hold, Side Plank, Dead Bugs, Pallof Press, Hanging Knee Raises, Hanging Leg Raises, Ab Wheel Rollouts, Reverse Crunches, Crunches, Bicycle Crunches, Russian Twists, Cable Woodchops.
- **"Hanging Knee Raises or Ab Wheel Rollouts" splits into two moves.** The old combined name joins the Hanging Knee Raises history group so its history carries over.
- **Weeks 1–3 keep their fixed moves.** The rotation still starts at week 4.
- **The rotation is a fixed formula, not a running counter.**
  - It counts only the days athletes see. The retired Bonus Upper, Extra Upper and Bonus Core are skipped.
  - `w` = week − 4, and `s` = the day's slot among the visible days.
  - Move = `(w + 3·s) mod 12`. No two days in a week get the same move, and each slot works through all 12.
  - Placement = start when `(w + s)` is odd. It flips every week for each slot.
- **Travel swaps for gym-only moves** are first drafts for Kevin's review:
  - Hanging Knee Raises and Hanging Leg Raises → Lying Leg Raises
  - Ab Wheel Rollouts → Inchworm Walkouts (renamed from "Plank Walkouts": any name containing "plank" is treated as a timed hold by `getExerciseKind`)
  - Cable Woodchops → Backpack Woodchops
  - Pallof Press keeps its existing travel swap
- **Body weight counts for leg raises only**, per the existing allow-list rule. Crunches, twists and woodchops don't count it.
- **Untouched:** past sessions, Your pick packs, the full-body days for 1–3 day athletes, Hyrox, Overload.

## Tasks:

- [x] 🟩 **Step 1: Decline Dumbbell Bench Press in Upper B, week 7+**
  - [x] 🟩 In `buildYearWeeks`, swap Incline for Decline in the Upper B exercises (8–10 reps, the block note).
  - [x] 🟩 Media: stills from free-exercise-db `Decline_Dumbbell_Bench_Press` (`lib/exerciseImages.ts`) and a video id (`lib/exerciseMedia.ts`).
  - [x] 🟩 How cue (`lib/exerciseHow.ts`), `Chest` (`lib/muscleGroups.ts`, `lib/movementLibrary.ts`), `Push` (`lib/movementPattern.ts`).
  - [x] 🟩 Alt shortlist (`lib/altExercises.ts`): Incline Dumbbell Bench Press, Chest Dips, High-to-Low Cable Fly, Incline Push-Ups.
  - [x] 🟩 Travel swap: Incline Push-Ups, hands raised (`lib/travelExercises.ts`).
  - [x] 🟩 Media, How cue and tags for the new Alt options (Chest Dips, High-to-Low Cable Fly). Add Chest Dips to the `lib/bodyweightShare.ts` allow-list.

- [x] 🟩 **Step 2: Grow the pool to 12**
  - [x] 🟩 Rewrite `AB_CORE_POOL` (`lib/abCoreRotation.ts`) with the 12 moves, fixed sets and reps for each.
  - [x] 🟩 Add the old combined name to the Hanging Knee Raises group in `lib/exerciseKey.ts`.
  - [x] 🟩 For each new move:
    - Stills and video. Reuse the Abs circuit media where it already exists (Reverse Crunches, Crunches, Bicycle Crunches, Russian Twists).
    - How cue.
    - `Core` group (`lib/muscleGroups.ts`, `lib/movementLibrary.ts`) and `Core` pattern (`lib/movementPattern.ts`).
  - [x] 🟩 Travel swaps for the gym-only moves (`lib/travelExercises.ts`). Add Hanging Leg Raises and Lying Leg Raises to `lib/bodyweightShare.ts`.
  - [x] 🟩 Alt shortlist for each new move, each with at least one travel-friendly option (`lib/altExercises.ts`).

- [x] 🟩 **Step 3: Fix the rotation**
  - [x] 🟩 Rewrite `applyAbCoreRotation` with the formula above, skipping retired and bonus days.
  - [x] 🟩 Update the comment above `programWithRetiredDays` in `lib/workoutData.ts`.

- [x] 🟩 **Step 4b (added): Leg Press on Lower B, week 7+**
  - [x] 🟩 Leg Press (3 × 10–12) replaces Leg Extension Machine or Goblet Step-Ups via a shared `WEEK_7_SWAPS` map (the decline now uses it too).
  - [x] 🟩 Leg Press stills, How cue, travel swap (shared `STEP_UP_SWAP`); Alt list leads with Leg Extension Machine and Goblet Step-Ups; Goblet Step-Ups gets its own stills.

- [ ] 🟨 **Step 4: Verify**
  - [x] 🟩 Print the move and placement for weeks 4–48 with a scratch script. Confirm no repeats within a week, every slot reaches all 12, and placement alternates.
  - [x] 🟩 Run `scripts/check-alt-travel-coverage.ts` and `scripts/check-movement-pattern-coverage.ts`.
  - [x] 🟩 Run `npm run lint` and `npm run build`.
  - [ ] 🟨 As Test, check that a week 7+ Upper B card shows Decline with its stills and that Alt offers Incline. — *Not run (no browser here). A library-level check confirmed stills, video, How cue, pattern, kind, Alt list and travel swap resolve for every new name. Still needs a live look.*

- [x] 🟩 **Step 5: Docs**
  - [x] 🟩 `CLAUDE.md`: update the 5-move pool sentence and note the Upper B week 7+ decline.
  - [x] 🟩 `docs/WHAT_IS_WORKIT.md`: update the core rotation and Upper B description.
