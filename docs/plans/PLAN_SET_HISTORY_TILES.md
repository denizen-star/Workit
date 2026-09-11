# Feature Implementation Plan

**Overall Progress:** `95%`

## TLDR
Replace the 4-tile live KPI grid on `components/LiveSetKpis.tsx` (shown under the last completed set in `components/ExerciseTracker.tsx`) with a history-aware redesign for **Incline Dumbbell Bench Press** and every other exercise. Instead of showing only the just-completed set's own numbers, the grid now shows how this exact set position (Set 1, Set 2, Set 3...) has performed across all past sessions, live-folding in today's own set the instant it's completed, plus an up/down indicator on every tile.

## Critical Decisions
- **Tile 1 — "Set N History"** replaces Set Volume + Set Effective: avg Weight × avg Reps · avg PE (Perceived Effort), for the same set number, across all past completed sessions. Extras (set numbers beyond the planned count) excluded. Travel/gym name variants merged via existing `exerciseHistoryKey()`.
- **Tile 2 — "Avg Effective"**: average each historical Set N's own Effective (weight × reps × effort factor), *then* average those — not derived from Tile 1's rounded averages.
- **Tile 3 — "Best"** (was "Last Time" / "All-Time Best"): before this set completes, shows the same Set N from only the most recent prior completed session. The instant today's Set N completes, it flips to show today's own weight × reps, with subtitle `PR · {prior weight} lb` noting what it replaced.
- **Tile 4 — "Volume"** (was "Session Volume"): changes from a running raw-lb total to the average volume (weight × reps) per completed set in today's session so far.
- **Live folding**: Tiles 1 & 2 recompute the instant today's same-set-number set completes, folding it into the historical average. Tile 3 rolls forward to today's set on completion (see above). Tile 4 is live by definition.
- **No-history fallback**: `—` placeholder, tile stays visible (never hidden).
- **Scope**: this change touches only `LiveSetKpis.tsx` / `ExerciseTracker.tsx`. `SessionTotalsBar`, `GET /api/stats`, badges, `daily_stats`, etc. keep using today's existing raw-total definitions — untouched.
- **Up/down indicators**: all four tiles get a ▲/▼ + raw delta badge.
  - Tile 1 delta: on **weight only** — avg weight after folding today's set minus avg weight before.
  - Tile 2 delta: recomputed Avg Effective minus the value before this set.
  - Tile 3 delta: today's weight minus the prior session's weight it just replaced.
  - Tile 4 delta: this session's average minus the average after the previous set; no arrow on the first set of the session (nothing to compare).
- **`?` helper**: every tile gets a small `?` icon (hover/focus tooltip) spelling out the tile's full name and formula, matching the app's existing `?`-helper convention (Daily weight chart, WeekLock legend, live-lift How).
- **Backend**: needs one new aggregation (per exercise + set number, across all past completed sessions: weight/reps/hardness averages, effective average). Everything else (last-session lookup for Tile 3, `exerciseHistoryKey` unification) already exists in `GET /api/exercises?history=1`.

## Tasks:

- [x] 🟩 **Step 1: Backend — per-set-number history aggregation**
  - [x] 🟩 Extend the history query in `app/api/exercises/route.ts` (`history=1` branch) to group already-fetched completed sets by `exerciseHistoryKey` + `set_number`
  - [x] 🟩 Compute per group: `weightAvg`, `repAvg`, `hardnessAvg` (raw 1–5 scores averaged, null defaults to 3), `effectiveAvg` (average of each set's own `weight × reps × effortFactor(hardness)`), and sample count — reusing `foldSetIntoHistory` row by row (DRY with the client-side fold)
  - [x] 🟩 Add this as a new `setNumberHistory` field in the route's response, alongside the existing `bestSets` / `lastSets` / `lastSessionByExercise`

- [x] 🟩 **Step 2: Client-side fold + delta helpers**
  - [x] 🟩 Add pure helper functions (in `lib/setHistory.ts` or a new small module) for: folding today's own completed set into a historical average, computing `effortFactor`-based Effective for one set, and computing a signed delta
  - [x] 🟩 No new API calls per set — today's own sets are already in local component state; folding happens client-side against the one `setNumberHistory` payload fetched with the rest of history data

- [x] 🟩 **Step 3: Redesign `LiveSetKpis.tsx`**
  - [x] 🟩 Replace the 4 existing props/tiles with: Set N History, Avg Effective, Best, Volume
  - [x] 🟩 Add the `?` help icon (reusing the app's existing `HelpTip` component — tap/focus box, not a hand-rolled hover tooltip), reused across all four tiles, each with its full name + formula text
  - [x] 🟩 Value + delta render on one line (no wrap), matching the reviewed mockup
  - [x] 🟩 `—` placeholder for any tile with no qualifying history, tile stays visible

- [x] 🟩 **Step 4: Wire it up in `ExerciseTracker.tsx`**
  - [x] 🟩 Consume `setNumberHistory` (extras naturally excluded — they land in their own higher set-number bucket, never polluting Set 1/2/3's average) and the existing `lastSets` for Tile 3
  - [x] 🟩 On each newly completed set (`lastDone`): fold today's set into Tiles 1 & 2, show today's value on Tile 3 with a PR line, recompute Tile 4's running average
  - [x] 🟩 Compute deltas from the "before this set" snapshot (the unfolded history / the previous session-volume average) at the moment each set completes
  - [x] 🟩 Removed the now-unused `bestSets`-driven "All-Time Best" tile code and the dead `liveSession` (whole-session) total that the old Session Volume tile relied on — Volume is now this exercise's own average, not the whole workout's

- [x] 🟩 **Step 5: Docs**
  - [x] 🟩 Added a `CLAUDE.md` passage describing the live KPI grid (it wasn't previously documented by name) — the four tiles, the live-fold/flip behavior, the delta rules, and the `setNumberHistory` aggregate

- [x] 🟩 **Step 6: Manual QA**
  - [x] 🟩 `npx tsc --noEmit` clean across the whole repo after all edits
  - [x] 🟩 Browser/Playwright driving wasn't available in this sandbox (no network access to fetch a Chromium binary), so verified via the running dev server instead: logged in as **Test** (PIN `0000`) over HTTP, hit `GET /api/exercises?history=1` (confirms `setNumberHistory` is present and well-formed, and correctly excludes the current session), logged and then cleaned up a real set via `POST`/direct-DB delete to confirm the existing set-completion path is unaffected
  - [x] 🟩 Validated `foldSetIntoHistory`'s aggregation against Kevin's real historical Incline Dumbbell Bench Press sets (read-only query, no session started or set logged as Kevin) — reproduced the exact Set 1/2/3 averages worked out by hand during exploration (e.g. Set 2: 71.7 lb × 11.3 reps, PE 4.0, Effective 892)
  - [x] 🟩 Simulated folding today's own set on top of that Set 2 history and confirmed `tileDelta` correctly signs both directions independently (weight ▲ +3.3, Effective ▼ -12.6 for the same completed set) — confirms the tiles are not forced to agree
  - [ ] 🟥 Full interactive walkthrough (fold/flip/delta appearing live in the browser as sets complete) still needs a real browser session — recommend a quick manual pass in the actual app as Test before shipping
