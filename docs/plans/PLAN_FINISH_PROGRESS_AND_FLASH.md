# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR
Two related live-workout UX fixes: (1) add a segmented, story-style progress bar across the post-finish screen sequence (Recap → Complete → Awards → Home) so athletes can see how many screens are left; (2) stop PR/gain-loss/hardness flashes from popping mid-exercise on every set — consolidate them to fire once, at the set that finishes the exercise's planned set count, same priority as today.

## Critical Decisions
- **Stepper screens counted**: only screens that will actually show this run (e.g. 3 segments, not 4, when no badge/belt was earned and Awards is skipped) — computed from the same conditions `app/workout/page.tsx` already uses to decide whether to render `AwardsTakeover`.
- **Stepper visuals**: Instagram-story style segmented bar (filled segments, no numbers). Manual only — advances as the athlete taps through the existing flow; no auto-advance timer, no tap-to-skip.
- **Flash trigger point**: all three flash types move to the same `exerciseJustFinished` trigger the hardness-call flash already uses (`ExerciseTracker.tsx:520-524`) — fires once when planned (non-extra) sets reach `exercise.sets`. Extra sets never retrigger it, matching current hardness behavior.
- **Flash priority when multiple apply**: unchanged — PR > gain/loss > hardness, single flash slot, only the highest-priority one shows for that exercise.
- **Gain/loss comparison basis**: unchanged signal — still compares the last completed set to its same-set-number prior-session counterpart (`setDirection` in `lib/setHistory.ts`) — just displayed once at exercise-end instead of immediately on whichever set triggered it.

## Tasks:

- [x] 🟩 **Step 1: End-of-exercise flash consolidation**
  - [x] 🟩 In `completeSet()` (`components/ExerciseTracker.tsx`), gate the PR and gain/loss branches behind `exerciseJustFinished` (same guard the hardness branch already used), so no flash fires until the exercise's last planned set completes
  - [x] 🟩 Keep the existing priority chain (PR > gain/loss > hardness) unchanged — evaluated once, at `exerciseJustFinished`, instead of on every set
  - [x] 🟩 Added `pendingPrRef` to remember the best PR seen across a mid-exercise set so it still surfaces (delayed) at exercise-end even though it happened on an earlier set; record-tracking state (`setHistory` personal-records write) still updates immediately per set, independent of when the flash displays
  - [x] 🟩 Manual QA: `tsc --noEmit` passes clean; logic traced by hand — no flash until the final planned set, extra sets don't retrigger (`exercise.sets` cap unchanged), and an early-set PR is remembered via `pendingPrRef` and still shown at exercise-end. Live in-browser QA still recommended before shipping.

- [x] 🟩 **Step 2: Post-finish segmented progress stepper**
  - [x] 🟩 Added `components/FinishStepper.tsx` — segmented bar, filled/unfilled states, no numbers, Instagram-story styling using the app's existing gold accent (`#e8c547`)
  - [x] 🟩 In `app/workout/page.tsx`, added `finishTotalSteps = 3 + (earnedBelt || awardedBadges.length > 0 ? 1 : 0)` derived from existing state, so the segment count reflects only the screens that will actually show (Awards skipped when nothing was earned)
  - [x] 🟩 Wired `step`/`totalSteps` props through the star-rating `Modal` (step 1) and the three finish components — `WorkoutRecapTakeover` (step 2), `CompleteTakeover` (step 3), `AwardsTakeover` (step 4) — rendering `FinishStepper` at the top of each; both duplicated render blocks (mobile-live and default) updated identically. Advances on the same taps that already move the flow forward — no new navigation logic
  - [x] 🟩 Manual QA: `tsc --noEmit` passes clean; logic traced by hand for both the earned-award path (4 segments) and the no-award path (3 segments, no gap left for the skipped Awards screen). Live in-browser QA still recommended before shipping.
