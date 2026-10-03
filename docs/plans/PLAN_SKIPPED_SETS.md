# Feature Implementation Plan — Skipped Sets

**Overall Progress:** `100%`

## TLDR
A lifting set completed less than 15 seconds after the session's previous completed set is a **skipped set**. While that window is open, the active set's button reads **Skip** (white, black text, fast-forward icon) instead of gold **Complete Set**. A skipped set keeps its numbers but counts for nothing: volume, the board, badges, Best/PR, set history, prefill and the Last time chip all ignore it. If half or more of a session's completed sets are skipped, that workout doesn't count toward the week. The athlete only ever sees **Skipped**. No reasons and no rule text. Reopening a skipped set with **Editing** and completing it makes it count again.

## Critical Decisions
- **Rule:** under 15s since the previous completed set in the same session. Fixed. Same definition the pacing scorecard already uses (`lib/emails/scorecard.ts`).
- **Server decides:** `POST /api/exercises` judges each first completion. The client button is only a hint.
- **Exempt (never skipped):** the first completed set of a session, timed/distance holds (`getExerciseKind`), and Hyrox circuit movements (exercise has a `circuitGroup`).
- **Storage:** a skipped set stays `is_completed = 1` (so the card still finishes, and Finish doesn't delete it) plus a new `is_skipped = 1`. A new `completed_at` is stamped on first completion. `created_at` isn't reliable for extras, which are inserted before they complete.
- **One SQL helper:** `sqlSetCounts(alias)` = `is_completed = 1 AND is_skipped = 0` replaces the bare `is_completed = 1` filter wherever sets are counted toward volume, records or history.
- **Session flag:** `workout_sessions.skipped_heavy` is set at Finish (skipped ≥ 50% of completed sets). Week counting and week lock ignore those sessions. The session still shows in the completed log.
- **Undo:** an Editing re-save of a skipped set clears `is_skipped`. If the session is already finished, `skipped_heavy` is recomputed and the week lock is re-checked. `locked_weeks` stays permanent.
- **No backfill:** sets logged before this ships stay as they are.

## Tasks

- [x] 🟩 **Step 1: Schema**
  - [x] 🟩 `database/migrate-skipped-sets.sql`: `exercise_sets.is_skipped TINYINT NOT NULL DEFAULT 0`, `exercise_sets.completed_at TIMESTAMP NULL`, `workout_sessions.skipped_heavy TINYINT NOT NULL DEFAULT 0`
  - [x] 🟩 Mirror in `database/schema.sql`; apply via `scripts/apply-migration.ts`

- [x] 🟩 **Step 2: Skip rule (server)**
  - [x] 🟩 `lib/skippedSets.ts`: `SKIP_WINDOW_MS = 15000`, `sqlSetCounts(alias)`, and `isSkipExempt(exerciseName, day)` (timed/distance, circuitGroup)
  - [x] 🟩 `POST /api/exercises`: on a set's first completion, stamp `completed_at` and compare to the latest `completed_at` (fallback `created_at`) of the session's other completed sets. Under 15s and not exempt → `is_skipped = 1`. Return `skipped` in the response
  - [x] 🟩 Editing re-save of an already-completed skipped set → `is_skipped = 0`; hardness-only re-rates don't touch it
  - [x] 🟩 On undo in a finished session, recompute `skipped_heavy` and re-run `recordWeekLockIfNeeded`

- [x] 🟩 **Step 3: Skipped sets count for nothing**
  - [x] 🟩 Swap `is_completed = 1` → `sqlSetCounts()` on set-level volume, record and history reads: `lib/exerciseKind.ts` volume, `lib/optionals.ts`, `lib/scoreboard.ts`, `lib/statsHousehold.ts`, `app/api/stats`, `lib/athletePerformance.ts`, `lib/exerciseCompare.ts`, `lib/badges.ts`, `lib/holdLine.ts`, `lib/weekPodium.ts`, `lib/houseWeekdays.ts`, `lib/yourPickCredit.ts`, `lib/emails/*` recap/scoreboard, `GET /api/exercises?history=1` (history, `bestSets`, `lastSets`), daily stats
  - [x] 🟩 Leave the scorecard's own rushed-rate timing as is, and leave the "is this card done" checks on plain `is_completed`
  - [x] 🟩 `GET /api/sessions` (+ `?history=1`) returns `is_skipped` per set and `skipped_heavy` per session

- [x] 🟩 **Step 4: Session doesn't count for the week**
  - [x] 🟩 Finish PUT: compute and save `skipped_heavy` before the week-lock count. Exclude `skipped_heavy` sessions from `completedThisWeek` (Finish PUT + mark-complete POST)
  - [x] 🟩 `lib/bonusDay.ts` `completedInWeek` ignores `skipped_heavy` sessions, so the tile, the "N / M" count, `coveredDayNumbers` and Home Start/nudges follow automatically

- [x] 🟩 **Step 5: Live card**
  - [x] 🟩 `components/ExerciseTracker.tsx`: track the session's last completion time (seeded from loaded sets, updated on each complete) with a 1s tick. While inside 15s and the active set isn't exempt, render **Skip** (white bg, black text, fast-forward SVG) in place of gold **Complete Set**; same handler
  - [x] 🟩 Use the server's `skipped` response: skipped sets don't fold into live KPI tiles, PR/gain detection, the Today bar or copy-forward prefill
  - [x] 🟩 Folded / one-line set row reads `Set N · Skipped` (earth red `#a35d52`), with no reason text

- [x] 🟩 **Step 6: Completed log + recap**
  - [x] 🟩 `CompletedSessionCard`: skipped sets read **Skipped**; totals already exclude them via Step 3
  - [x] 🟩 `WorkoutRecapTakeover` + recap email: skipped sets marked **Skipped** and left out of This/Last numbers

- [x] 🟩 **Step 7: Docs**
  - [x] 🟩 Update `docs/WHAT_IS_WORKIT.md`, `app/help/page.tsx` (glossary: Skipped) and `CLAUDE.md` (migration line + rule)
