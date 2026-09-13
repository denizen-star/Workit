# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR
Rework how athletes rate a set and see it land: a smaller "Micro + Dots" How-hard slider, a one-line collapsed set row with a gold effort bar, a spring-bounce fold animation on every set, a bigger gold-sweep + checkmark-stamp celebration when an exercise's last planned set is rated, and a clearer "Banner" rest bar with a pop-in entrance. Also fixes the Best/PR tile so "PR" means a true all-time max instead of "same slot, last session." All 6 pieces were visually validated this session via live preview routes (`/preview-hardness`, `/preview-animations`, `/preview-restbar`, `/preview-misc`, `/preview-final`); this plan productionizes them and retires the preview scaffolding.

## Critical Decisions
- **How-hard selector** → "Micro + Dots" slider (thin track, gold dot markers, trailing word badge, no label row) replaces the 5-button row in `SetHardness.tsx` — validated in `/preview-hardness`, reference impl at `components/hardness-variants/SliderMicroDots.tsx`.
- **Set-row fold trigger** → rating the set (or moving on without rating, which folds it as a silent Fair/3) — not the "Complete Set" tap. Folded row = one line + a 5-segment gold effort bar (reference: `components/hardness-variants/EffortBar.tsx`), no exercise-card-level collapse (explicitly out of scope).
- **Set-complete animation** → spring bounce in place, then a real height-collapse (CSS grid-rows technique) into the folded line — not a crossfade.
- **Exercise-complete animation** → rating the last planned set fires a toned-down/1.4s gold sweep + a checkmark stamp next to the title, on top of (not instead of) the existing PR/gain-loss/hardness flash — the celebration always plays first, then the existing single-slot flash follows if one is due.
- **Rest bar** → `SetRestTimer.tsx` (the one component used for all rest, within-exercise and rolling into the next one) becomes a taller "Banner" callout with a bouncing icon, bold headline, explainer line, and full drain bar, arriving with a pop/slide + gold glow-ring entrance. Existing urgent-state pulse/buzz and Progress counter are preserved.
- **PR/Best tile** → "Best" becomes the true all-time max for the movement (any set position), sourced from existing `personalRecords`/`bestSets` data; subtitle explains which set/when. Bodyweight-zero and ungrouped gym/travel key-reset are fixed alongside it since they touch the same tile/data path.
- **Sequencing rule (cross-cutting)** → celebration → rest bar → Finish takeover stack (recap → complete → awards) never overlap. The last-set-of-last-exercise edge case is handled by gating `completeWorkout`'s `setShowRecap(true)` call until the celebration has finished.
- **Cleanup** → all `/preview-*` routes and `components/hardness-variants/*` were scratch space for this design pass; once the real components are in place, they're deleted, not left behind.

## Tasks:

- [x] 🟩 **Step 1: Best/PR tile — true all-time max**
  - [x] 🟩 In `app/api/exercises/route.ts`, `bestSets` now carries `set_number`/`done_at` alongside the existing all-time max weight+reps, for both past sessions and the in-progress one
  - [x] 🟩 (No new `lib/setHistory.ts` helper needed — `bestSets` from the server is already the true all-time max per movement, so the client reads it directly instead of via a `lastSpotFor`-style lookup)
  - [x] 🟩 In `components/ExerciseTracker.tsx`, the "Best" tile now shows the true all-time max (flipping to today's set + "New PR" the instant it's beaten), subtitle shows `Set N · {date or "this session"}` via the existing `formatWhen` helper (`lib/kpiView.ts`) instead of `PR · {weight} lb`
  - [x] 🟩 Bodyweight-zero bug fixed as a side effect: the new subtitle format never prints the raw weight, so a 0 lb bodyweight set no longer renders "PR · 0 lb"
  - [x] 🟩 Audited `lib/exerciseKey.ts` `GROUPS` against every gym→travel substitution in `lib/travelExercises.ts`: found and fixed no unsafe gaps to merge automatically — 2 residual gaps ("Incline Dumbbell Bench Press" / "Barbell or Chest-Supported Rows") were left alone and documented in-code, since folding them in would silently merge two distinct lifts' PR history (a program-design call, not a safe data fix)

- [x] 🟩 **Step 2: How-hard selector — Micro + Dots**
  - [x] 🟩 `components/SetHardness.tsx` rewritten to the Micro + Dots layout (thin track, overlaid gold dot markers, trailing word badge, no label row); `value` / `busy` / `highlight` / `onPick` contract unchanged, so no caller needed updating
  - [x] 🟩 Locked/disabled state uses `aria-disabled` + `pointer-events-none` instead of the native `disabled` attribute, so the gold accent color survives locking (no gray-out)
  - [ ] 🟥 Delete `components/hardness-variants/SliderMicroDots.tsx` — deferred to Step 8 (cleanup), since preview routes still import it while the rest of this plan is in progress

- [ ] 🟥 **Step 3: Set-row fold + effort bar**
  - [x] 🟩 Added permanent `components/EffortBar.tsx` (5-segment gold fill), imported into `ExerciseTracker.tsx`
  - [x] 🟩 A folded set now has two states: unrated (unchanged — header + How-hard widget) and resolved (rated, or "moved on" without rating), which shows a true one-line row (`Set N · weight × reps` + `EffortBar`) — implemented as two stacked CSS grid-row blocks that collapse/grow together so the row visibly shrinks into the line
  - [x] 🟩 Skip case handled via a `resolved` flag: a later set in the same exercise being underway/done, or the athlete having completed a set in a different exercise (`lastTouchedExercise`), folds the row with a default Fair/3 effort bar even with no explicit rating
  - [x] 🟩 Tapping the one-line row (or the original "Completed" pill, for the still-unrated state) reopens the same `editingSet` toggle as before — no new edit mechanism

- [x] 🟩 **Step 4: Set-complete animation**
  - [x] 🟩 Fold now triggers from `SetHardness`'s `onPick` (a local `bouncingRowKey` state is set there), not from the "Complete Set" tap
  - [x] 🟩 Added `set-row-bounce` (380ms) keyframe in `globals.css`; the grid-row transition already added for Step 3 provides the ~300ms height-collapse into the folded line right after

- [x] 🟩 **Step 5: Exercise-complete celebration**
  - [x] 🟩 `completeSet`'s existing `exerciseJustFinished` block now stores a deferred flash thunk in `pendingFinishRef` instead of firing immediately; `resolveFinish(exerciseName)` shows the `exercise-card-sweep` + `exercise-title-stamp` celebration (1.4s, toned-down brightness — see `globals.css`) first, then fires the stored PR/gain-loss/hardness flash after `CELEBRATION_MS` (1500ms)
  - [x] 🟩 `resolveFinish` is called from two places: `saveHardness` (rating the last planned set) and `completeSet` (moving to a different exercise resolves any still-pending finish left behind)
  - [x] 🟩 Priority logic (PR > gain/loss > hardness, single slot) is untouched — only *when* it fires changed, not *which* one fires

- [x] 🟩 **Step 6: Rest bar redesign**
  - [x] 🟩 `components/SetRestTimer.tsx` rebuilt as the Banner callout (bouncing icon, bold "Resting" headline, explainer subtitle, full-width drain bar, Progress + Skip row)
  - [x] 🟩 Added `rest-bar-entry` (pop/slide-in) + `rest-bar-ring-pulse` (gold glow-ring) on arrival, `rest-bar-icon-bounce` continuous subtle bounce
  - [x] 🟩 Existing urgent-state `animate-pulse` + vibrate-buzz and the completed/total Progress counter are unchanged

- [x] 🟩 **Step 7: Takeover sequencing guard**
  - [x] 🟩 `ExerciseTracker` is now a `forwardRef` exposing `awaitPendingCelebration()`; `app/workout/page.tsx` holds `exerciseTrackerRef` and awaits it at the top of `completeWorkout`, before any of its own async work or `setShowRecap(true)` — there's only one `completeWorkout`/one takeover-state chain in this file, so one gate covers it
  - [x] 🟩 Confirmed (not a code change): `ResumeTakeover` can't overlap the rest bar — `ExerciseTracker` remounts fresh on reopen (`restToken`/`running` start at 0/false), so the rest bar only ever appears after a *new* set completes post-resume, never synchronously with the resume modal

- [x] 🟩 **Step 8: Cleanup**
  - [x] 🟩 Deleted the preview routes: `app/preview-hardness`, `app/preview-animations`, `app/preview-restbar`, `app/preview-misc`, `app/preview-final` (`app/preview-finish` left alone — pre-existing, unrelated to this plan)
  - [x] 🟩 Deleted `components/hardness-variants/` in full; confirmed nothing outside it referenced those files first

## Verification
- `npx tsc --noEmit` — clean, no errors.
- `npx eslint` on every touched file — no new errors or warnings (checked each against its pre-change baseline via `git stash`).
- `npm run build` — production build succeeds; the deleted preview routes are gone from the route list, `/preview-finish` (pre-existing, out of scope) still there.
- Logged in as the household `Test` account (PIN `0000`) against the real dev server + database: `/home` and `/workout` both load (200, no server error); `GET /api/exercises?history=1` returns the new `bestSets[...].set_number` / `.done_at` fields correctly for real historical data.
- **Not done**: interactive browser verification of the animations themselves (rating a set and watching the bounce/fold, finishing an exercise and watching the sweep/stamp celebration, triggering the rest bar) — this needs a real browser session stepping through an actual workout, which wasn't available in this pass. Recommend a manual pass as the `Test` athlete before shipping.
