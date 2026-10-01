# Feature Implementation Plan — Lift card hints cleanup

**Overall Progress:** `92%`

## TLDR
The top of every live lift card stacks four hints that overlap and contradict each other: the gold "Next" box, the Aim line, "Last time", and a "Last week" / "Beat last week. Suggested next" chip. Two of them suggest different weights (105 vs 165). This plan cuts the main program down to a single "Last time" line. Overload Progressions weeks keep one gold **Aim for** box with the effort line and "Last time" folded in. That box changes to **You're past it** once a set today beats the target, and it never asks for more after a Max.

## Critical Decisions
- **Main program, Hyrox, Test Drive and Your pick show only "Last time".** The target box is what sets Overload apart, since adding weight week to week is that program's whole point.
- **Overload is detected by week number:** `programTrackForWeek(weekNumber) === 'overload'` (`lib/programTrack.ts`). `ExerciseTracker` already receives `weekNumber`, so no new prop is needed.
- **The "Last week" and "Beat last week / Suggested next" chips are removed outright.** "Last week" repeated "Last time" with less detail. The "Suggested next" number added its step to today's heaviest set, which produced numbers like 165 that made no sense.
- **"Next" is renamed "Aim for"** so it can't be read as "your next set".
- **The effort line goes inside the box, on Overload only**, because only Overload's target effort changes week to week.
- **Never ask for more after a Max.** When last session's average effort was Max and the reps were within range, the target is the same weight × the reps actually hit, with the reason "Last time was Max — match it, keep a rep in the tank". The existing drop of about 7.5% still applies when a Max came with reps below the range.
- **What counts as "past it":** a finished set today with more weight than the target, or the same weight with more reps. It is computed client-side from today's sets. Nothing new is stored.
- **Bodyweight, timed and distance lifts** keep the "Last time" line only, on every program, as today.

## Tasks:

- [x] 🟩 **Step 1: Fix the Max rule in `lib/nextLoad.ts`**
  - [x] 🟩 Add a `'match'` action. When average effort is 5 and reps are not below the range minimum, return the same weight × best reps hit (instead of `'reps'` with +1).
  - [x] 🟩 `nextLoadLabel`: change the title from `Next:` to `Aim for:`. Add `'match'` detail "Last time was Max — match it, keep a rep in the tank".
  - [x] 🟩 Export an `aimEffortText(targetEffort, lastSetCue)` (the "at Hard · about 2 reps left" text without the `Aim:` prefix) for use inside the box. Keep `aimLine` only if something else still uses it, otherwise remove it.

- [x] 🟩 **Step 2: Add the "past it" check**
  - [x] 🟩 Add `pastTarget(next, completedSets)` in `lib/nextLoad.ts`. It returns the first finished set today with weight > the target, or the same weight with reps > the target, else null. It compares in lb against `next.weightLbs` / the numeric `repTarget` top.

- [x] 🟩 **Step 3: Rework the card header in `components/ExerciseTracker.tsx`**
  - [x] 🟩 `isOverload = programTrackForWeek(weekNumber) === 'overload'`. Compute `nextLoad` only when `isOverload`.
  - [x] 🟩 Overload plus a target, normal state: one gold box with **Aim for: X × Y**, the reason line, the effort line (`aimEffortText`), and a small "Last time: … · Effort N" line inside.
  - [x] 🟩 Overload, past-it state: the box reads **You're past it · {weight} × {reps}** with "Log it and we'll aim higher next time." and no Last time line.
  - [x] 🟩 Everything else (main, Hyrox, Test Drive, Your pick, and Overload lifts with no target): keep only the existing "Last time" chip.
  - [x] 🟩 Delete the standalone Aim `<p>`, the "Last week" chip, the "Beat last week" chip, and the `lastWeek` / `currentMax` / `beatLastWeek` locals.
  - [x] 🟩 The box still hides once `exerciseFullyDone`.

- [x] 🟩 **Step 4: Remove dead code**
  - [x] 🟩 Remove `lastWeekMax` and `previousWeek` from `GET /api/exercises?history=1` (`app/api/exercises/route.ts`) and from `HistoryPayload` in `ExerciseTracker`. Drop the `weekNumber` query param if nothing else reads it.
  - [x] 🟩 Remove `suggestedNextWeight` from `lib/exerciseKind.ts` and its import.

- [ ] 🟨 **Step 5: Verify**
  - [x] 🟩 `npm run build` + `tsc` clean; ESLint on changed files shows only pre-existing `any` errors (`next lint` no longer exists in this Next version). Rule check via a tsx script: Max at 15 → match 105 × 15, Hard at 15 → +step, Fair at 13 → 14, Max below range → drop, 160 × 30 → past it.
  - [ ] 🟥 As **Test**: check that a main-program card shows only "Last time". On an Overload week (or with a temporary local check), see the normal, after-Max and you're-past-it states.

- [x] 🟩 **Step 6: Docs**
  - [x] 🟩 Rewrite the **Next load + Aim** section of `CLAUDE.md`: Overload only, "Aim for", the Max match rule, past it, and the removed chips.
  - [x] 🟩 Update the matching lines in `docs/plans/PLAN_OVERLOAD_PROGRESSIONS.md` (Step 8 marked superseded) and the `/help` glossary (Next + Aim → one "Aim for" entry). `docs/WHAT_IS_WORKIT.md` Next/Aim paragraph rewritten; CHANGELOG Unreleased entry added.
