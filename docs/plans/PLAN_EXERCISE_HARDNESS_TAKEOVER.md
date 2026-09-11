# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Defer the "How hard?" takeover flash from firing after every individual completed set to firing once, when the last planned set of an exercise completes, showing the average hardness across that exercise's sets. Per-set voting UI and data storage are unchanged — only the flash timing and its content move from set-level to exercise-level.

## Critical Decisions

- **Per-set voting unchanged:** Each set still gets its own skippable 1–5 tap, locked once tapped, saved to `exercise_sets.hardness` via `POST /api/exercises`. No change to `lib/hardness.ts` math (`hardnessEffortFactor`, `effortFromVolume`, `sqlSetEffortVolume`) or to stats/volume calculations.
- **Flash moves, not the vote:** The `hardnessCopy()` flash no longer fires per-set. It fires once, when the exercise's set-completed count first reaches its planned `exercise.sets` total.
- **Aggregate = simple average:** Exercise-level score is the mean of that exercise's set hardness scores; any set without a vote defaults to 3 (Fair), matching today's `DEFAULT_HARDNESS` fallback.
- **Extra sets after the flash are silent:** Once the exercise-level flash has fired, adding and completing extra sets never re-triggers it. Per-set voting continues normally on those extra sets, but no second flash and no recompute.
- **Mode switching needs no new handling:** The per-exercise Gym/Travel pill already locks after the first completed set on that movement, which already rules out the scenario (mode changing mid-exercise) that made the earlier "once per exercise" attempt (see CLAUDE.md) unreliable.
- **Scope boundary vs. the reverted attempt:** This is a flash-timing change only, not a completion-tracking rewrite — deliberately narrower than the old three-way Set/Exercise/Off dial that was cut back to plain on/off.
- **Implementation note (no explicit "already flashed" state):** The planned-sets array for an exercise (`set_number <= exercise.sets`) never changes length — extras only add numbers above it — and a set can only go incomplete → complete, never back. So "one more completion reaches the planned total" is mathematically a one-time transition per exercise; no `Set<string>` bookkeeping was needed to prevent a re-trigger from extra sets. Simpler than Step 2 as originally scoped, same guarantee.
- **Implementation note (flash precedence):** The exercise-level takeover reuses the same single-slot flash state as the PR flash and the gain/loss (up/down) flash. Rather than add queueing, it was wired as a third `else if` alongside those two (PR > gain/loss > exercise-effort), so on the rare tick where an exercise's last set is *also* a PR or a notable weight change, the effort takeover is skipped that one time in favor of the higher-priority flash. Flagging this as a deliberate minimal trade-off, not an oversight.

## Tasks:

- [x] 🟩 **Step 1: Detect per-exercise completion**
  - [x] 🟩 In `components/ExerciseTracker.tsx`, derive "this exercise just completed" from `setsForMovement(exerciseSets, exercise.name)` vs. `exercise.sets` — true on the transition where completed count first reaches the planned total

- [x] 🟩 **Step 2: Track one-shot state per exercise**
  - [x] 🟩 Superseded — see "Implementation note (no explicit 'already flashed' state)" above. The planned-set-count equality check is naturally one-shot, so no extra state was added.

- [x] 🟩 **Step 3: Move the flash from `saveHardness` to the completion trigger**
  - [x] 🟩 Stop calling `hardnessCopy()` inside `saveHardness` per vote
  - [x] 🟩 On the Step 1 completion trigger, compute the average of that exercise's set `hardness` values (default 3 for unset) via `averageHardness()`, and call `hardnessCopy()` once with that value

- [x] 🟩 **Step 4: Confirm no data-layer changes needed**
  - [x] 🟩 Verified `POST /api/exercises` (per-set hardness write) is untouched and still fires on every vote regardless of the flash change

- [x] 🟩 **Step 5: Manual QA**
  - [x] 🟩 Complete an exercise's sets one at a time with `noiseEffort` on — confirmed no flash until the last planned set, then one takeover with the correct average (browser-driven QA against `npm run dev`, logged in as Test: "Single-Arm Dumbbell Rows" set 2 → no flash, set 3 → flash fired, title/body "Honest work / That met you. Stay present. Growth lives here." — score 3, correctly averaging three unvoted sets defaulting to Fair)
  - [x] 🟩 Added and completed an extra set after that flash — confirmed it stayed silent (no second takeover)
  - [x] 🟩 Unvoted sets defaulted to 3 in the average (verified above — all three sets were unvoted, average landed exactly on 3/Fair)
  - [ ] 🟥 `noiseEffort` off suppressing the flash — not separately re-tested (code path unchanged from the pre-existing `noiseEffort === 'set'` gate, now just checked at a different call site)
