# Feature Implementation Plan — Circuits

**Overall Progress:** `67%` (Step 5 on hold until Kevin says go; Step 6 verification pending)

## TLDR
Make the current exercise card obvious, then add a **Circuits** family (superset / circuit / HIIT) offered through Your pick, with its own round-based standalone live view. Stations log as normal `exercise_sets` rows, so history, PRs and the Library keep working. Hyrox moves its circuit blocks onto the shared component last.

**How big:** Medium-large. Roughly 2 small + 2 medium + 1 large piece. Step 1 is a few hours, no data risk. Steps 2–4 are the real feature (about 1 new component, 1 new lib file, 1 new session type threaded through the Your pick path). Step 5 is optional cleanup. No new tables; at most one small migration (pick type / day numbers are plain values). Shippable in stages, each step independent of the next.

## Critical Decisions
- Ship the highlight first, on its own: presentation only, no data risk.
- One engine, three shapes: Superset (2 stations), Circuit (3+, may include a run leg), HIIT (timed work/rest, no weights).
- Entry point is Your pick: new **Circuits** category chip, several templates in the existing dropdown, filtered by Focus chips like other categories.
- Standalone live view (like `YourPickFlow`), not the exercise-card list: one station on screen, Round N of M · Station N of M, next station previewed, no rest between stations, rest once after the round's last station.
- Logging unchanged: each station writes `exercise_sets` rows under its own movement name. Weight prefilled from the previous round, editable.
- HIIT credit = Yoga/Core rule (`lib/yourPickCredit.ts`): 7-day average raw lifting session → all-time → 2,000 lb, × effort of `session_hardness`. Circuits with lifts count by their logged sets.
- Circuit stations are exempt from the 25s skip rule (`isSkipExempt`), same as Hyrox circuit moves.
- Circuits count toward the week like any Your pick (count-based lock).
- Hyrox adopts the shared station/round component last; its red "Step N of M" badge is replaced then.

## Tasks:

- [x] 🟩 **Step 1: Current-card highlight (standalone, ships first)**
  - [x] 🟩 In `components/ExerciseTracker.tsx`, derive per-card state: current (first card with an incomplete set), up next, done
  - [x] 🟩 Current: gold border + soft glow; auto-scroll into view when the previous card finishes
  - [x] 🟩 Done: dimmed (opacity) — one-line fold deliberately skipped, finished cards already hide their setup chrome
  - [x] 🟩 Circuit badge shows "Round N of M · Step N of M" (`lib/currentCard.ts`)

- [x] 🟩 **Step 2: Circuit definitions and session type**
  - [x] 🟩 New `lib/circuits.ts`: template type (`superset` | `circuit` | `hiit`), stations, rounds, work/rest seconds, run leg
  - [x] 🟩 Write several templates (e.g. push/pull superset, lower superset, run + lifts circuit, easy HIIT)
  - [x] 🟩 Add `circuit` pick type, own day-number range, and Circuits category chip/group in `lib/yourPick.ts` + `YourPickSheet`
  - [x] 🟩 Validate server-side in `lib/yourPickStart.ts`; resolve via `resolveSessionDay` / `isFlowPickType`; session name `Your pick · Circuit · <name>`
  - [x] 🟩 Focus chip mapping in `lib/focusRotation.ts` `pickCategoriesForFocuses`

- [x] 🟩 **Step 3: Standalone round-based live view (lifting + run circuits)**
  - [x] 🟩 New `components/CircuitFlow.tsx`, launched like `YourPickFlow` from `/workout`
  - [x] 🟩 Station screen: round/station header, current station, next-station preview, weight/reps (or time/distance for run), Done
  - [x] 🟩 Weight prefilled from previous round, editable; rows saved via existing `POST /api/exercises`
  - [x] 🟩 No rest between stations; shared rest timer once after the last station of each round
  - [x] 🟩 Add circuit stations to `isSkipExempt` (`lib/skippedSets.ts`)
  - [x] 🟩 Normal Finish: stars → recap → complete → awards; week count via Your pick rules

- [x] 🟩 **Step 4: HIIT variant**
  - [x] 🟩 Timed work/rest clock in its own `components/HiitFlow.tsx` (split from `CircuitFlow` — one responsibility each) (auto-advance, manual Next/Skip rest, like Abs)
  - [x] 🟩 Time-only logging, end How hard, no weights
  - [x] 🟩 Credit via `lib/yourPickCredit.ts` (same rule as Yoga/Core) into `credit_lbs` at Finish
  - [x] 🟩 Treat as flow pick for Finish/credit paths (`isFlowPickType` / `isTimedPickType` as needed)

- [ ] 🟥 **Step 5: Hyrox onto the shared component**
  - [ ] 🟥 Extract the station/round block from `CircuitFlow` for embedding in a mixed day
  - [ ] 🟥 Replace Hyrox circuit cards (`circuitGroup` / `noRestAfter` rendering in `ExerciseTracker`) with the shared block
  - [ ] 🟥 Remove the old red "Step N of M" badge once nothing uses it

- [ ] 🟨 **Step 6: Docs and verification**
  - [x] 🟩 Update `CLAUDE.md` (Your pick, live view, skip exemption), `docs/WHAT_IS_WORKIT.md`, `app/help/page.tsx`
  - [x] 🟩 One typecheck; one API test on the server change (Test user: circuit + HIIT start, mode/day validation, back-to-back sets not skipped, HIIT credit)
  - [ ] 🟥 First screenshot of the live views — no browser tool in the unmonitored run; Kevin to eyeball (see test list)
