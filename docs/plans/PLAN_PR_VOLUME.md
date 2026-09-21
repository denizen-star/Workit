# Feature Implementation Plan — PR Definition: Weight × Reps

**Overall Progress:** `100%`

## TLDR

Reverse the Sept 11 decision (`4d709c6`) that made the "Best"/PR concept weight-first with reps as a tiebreak. Going forward, the winning historical set for a weighted exercise is the one with the highest `weight × reps` (volume), not the heaviest weight. The actual weight and reps of that winning set are still stored and shown exactly as before — nothing about the underlying data changes, only which set gets picked as "the record." Timed/distance exercises (Plank Hold, runs, etc.) are unaffected — there's no weight to multiply, so they keep comparing on duration/distance alone.

## Critical Decisions

- **Scope**: exactly the three sites already identified as duplicating "heaviest wins" comparison logic — `personalRecords` and `bestSets` (`app/api/exercises/route.ts`), and `bestLoggedSet` (`lib/setHistory.ts`). `lib/holdLine.ts`'s Home hold-line feature calls `bestLoggedSet` directly, so it inherits the new rule automatically — not a separate task.
- **Tie-break at equal volume** (e.g. 60lb×5=300 vs 30lb×10=300): **prefer the higher weight**. Not explicitly stated by the user — flagging this as the one assumption in this plan; if wrong, it's a one-line change in the shared comparator once built.
- **Timed/distance exercises unaffected**: `weight × reps` only makes sense for genuinely weighted movements. Plank Hold, runs, and anything else where `kind === 'timed' || kind === 'distance'` keeps comparing on duration/distance alone, same as today.
- **`personalRecords` changes shape, not just rule**: today it tracks max weight and max reps *independently* (two separate running maxes, not a pair) — that's structurally incompatible with a volume definition, since volume ties weight and reps together. After this change it becomes a paired best-set record, computed the same way `bestSets` already is. The two will hold equivalent values (different consumers: the live PR flash vs. the "Best" KPI tile), so this is also a chance to stop duplicating the comparison logic between them.
- **The live "NEW PR" flash comparison must move too**: `components/ExerciseTracker.tsx`'s `isWeightPr = weight > record.weight` (the client-side check that decides whether to fire the flash) is a *fourth* place carrying today's weight-first rule, even though it's not one of the three "computation" sites — it reads `personalRecords` but makes its own separate weight-only comparison. Missing this would mean the server now records volume-based PRs correctly, but the flash a athlete actually sees stays keyed on weight and silently misses genuine volume PRs (e.g. 50lb×7=350 beating a prior 60lb×5=300 PR — `50 > 60` is false, so no flash, even though it's a real PR now). This has to change in lockstep with the other three.

## Tasks:

- [x] 🟩 **Step 1: Shared comparator**
  - [x] 🟩 Added `betterSet(a, b)` to `lib/setHistory.ts`: higher `weight × reps` wins, tie-broken by weight then reps — the reps tie-break is what keeps timed/distance sets (always weight 0) comparing purely on duration/distance, unchanged from before
  - [x] 🟩 Rewrote `bestLoggedSet` to `sets.reduce((best, set) => betterSet(best, set))`

- [x] 🟩 **Step 2: Server-side PR/Best computation** (`app/api/exercises/route.ts`)
  - [x] 🟩 `trackBestSet` now calls `betterSet` instead of its own duplicated weight-first comparison
  - [x] 🟩 `personalRecords` is no longer tracked as two independent running maxes — since it uses the exact same rule over the exact same rows as `bestSets`, it's now *derived* from `bestSets` in one pass after both loops finish, rather than updated in parallel (removes 8 lines of duplicate tracking across two loops, and the two fields can no longer drift out of sync with each other)
  - [x] 🟩 Timed/distance confirmed unaffected: `betterSet`'s weight tie-break is always 0=0 for those (no `weight_lbs`), so it falls straight through to the reps tie-break — pure duration/distance comparison, same as before

- [x] 🟩 **Step 3: Live PR flash detection** (`components/ExerciseTracker.tsx`)
  - [x] 🟩 `isWeightPr` now compares `weight × reps > record.weight × record.reps`; `isTimedPr` untouched
  - [x] 🟩 Fixed the optimistic local-state update after a PR: it was `Math.max`-ing weight and reps *independently*, which could stitch together a weight/reps combination that was never actually logged (inflating the stored record beyond what was really lifted) — now stores the just-completed set's own `{weight, reps}` directly, since `isWeightPr`/`isTimedPr` already establishes it as the new winner
  - [x] 🟩 Also fixed the flash's display text: it showed only `${weight} lbs`, which would misrepresent a PR now driven by a rep increase at the same or lower weight — changed to `${weight} lb × ${reps}` (matches `lib/holdLine.ts`'s existing display convention)

- [x] 🟩 **Step 4: Verify**
  - [x] 🟩 `tsc --noEmit` and `eslint` clean on every touched file (same pre-existing `any`/`<img>` warnings as before, nothing new)
  - [x] 🟩 Unit-level: `betterSet`/`bestLoggedSet` checked directly against 5 scenarios (heavier-lower-volume loses, lighter-higher-volume wins, equal-volume tie-break prefers weight, timed duration-only compare, `bestLoggedSet` over a mixed list) — all matched
  - [x] 🟩 Live end-to-end against the real API (not a reimplementation): inserted a synthetic completed session for Test, called `GET /api/exercises?history=1` through an authenticated session exactly as the client does. 65lb×4 (volume 260) recorded as the best; adding 50lb×7 (volume 350) correctly replaced it in both `bestSets` and `personalRecords`, both perfectly in sync (they're derived from the same source now); adding 55lb×5 (volume 275, still less than 350) correctly did **not** override the 50×7 record. Synthetic data cleaned up after.
  - [x] 🟩 Timed/distance path confirmed unchanged in code (not touched) and via the direct `betterSet` unit check (45s vs 60s plank comparison)
  - [x] 🟩 Regression check: live workout session still loads and renders cleanly post-change, zero console errors
