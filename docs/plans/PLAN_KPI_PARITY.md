# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Bring Home, Your performance, The house, and the live sticky bar to the four-KPI sample, without removing the sections already on Home in the screenshots: Your trophies, 4 of 4 days / Lock the week, More load / Fewer drops, Daily weight lifted, and You vs. Fix the number model so Weight / Reps / Volume / Effective are the same pile as the sample (all mechanical sets in the window), then fill the remaining copy and live-set gaps.

## Critical Decisions

- Keep the screenshot Home blocks as they are (`BeltChest`, `WeekLock`, `WeekPerformance`, `DailyWeightChart`, `YouVsLeader`). Do not replace or restyle them into sample stubs.
- Window KPIs must sum **completed mechanical sets** in the period (Weight sum + avg/set, Reps sum + avg/set, Volume = Σ reps × weight, Effective = Volume × Effort). Stop summing “heaviest set per lift.”
- Home order stays: hero → four KPIs + last session + week vs last time → trophies → week lock → More load → Daily weight → You vs → short Current / Progress read → Open Your performance.
- House keeps You vs as in the screenshot (bars + four KPI columns). Add prior-window % and a Tracking line on athlete cards. Put Daily weight back only on Home (already there), not as a second house chart unless we restore the old house chart under Pack Volume.
- No Set grain. No Words tab. No AI Why — template sentences from deltas only.

## Tasks:

- [x] 🟩 **Step 1: Window KPI totals from all mechanical sets**
  - [x] 🟩 Add window aggregates on `athletePerformance` (weight sum, set count, rep sum, volume, effective, prior-window twins, sparks by day)
  - [x] 🟩 Point `kpisFromBoard` at those aggregates (avg/set, not avg/lift)
  - [x] 🟩 Merge those fields in `mergeAthletePerformanceBoards`
  - [x] 🟩 House period rows: Weight / Reps stay set-sums; Volume stays raw (optional +500 stays out of Volume, in Effective / display only if that is already house law — do not change rank)

- [x] 🟩 **Step 2: Last session + week vs last time match the sample cards**
  - [x] 🟩 Last session: date · minutes · sRPE (session stars × minutes when a rating exists)
  - [x] 🟩 Best progress / Did not improve: template Why from Weight / Reps / Volume / Effective deltas
  - [x] 🟩 Week vs last time: one word row (Held / Up / Down) across this program week’s lifts, plus the stronger-if-Volume-up line
  - [x] 🟩 Share this through `HomeKpiLead` and Performance Current

- [x] 🟩 **Step 3: Home stays the screenshot stack, short performance read**
  - [x] 🟩 Leave `BeltChest`, `WeekLock`, `WeekPerformance`, `DailyWeightChart`, `YouVsLeader` in place
  - [x] 🟩 `PerformanceDesk` home variant: Current = four KPI rows only; Progress = N up · N down + last-session word KPIs; link to the page
  - [x] 🟩 Do not repeat last session / lift bars / Filter on Home

- [x] 🟩 **Step 4: Your performance Current / Progress / Filter parity**
  - [x] 🟩 Current: “what you did” four KPIs, last session, best / held, **every** window lift with Volume / Effective bars (no 8-cap), then Hard sets / muscle (How hard 4–5 in the window)
  - [x] 🟩 Progress: verdict sentence from last session deltas, by-workout cards, moving up / down / held with Why lines
  - [x] 🟩 Filter: keep Cut fold, T-15 default, Workout + Exercise grain, four-KPI spike, Volume % rows, hide empty; no Session / Set grain

- [x] 🟩 **Step 5: The house cards + You vs**
  - [x] 🟩 Keep screenshot You vs (cream / copper bars, Days · Best · Effort, You / rival KPI lists)
  - [x] 🟩 Athlete cards: big Volume, last + Effective, four KPIs, Workouts / Effort / Belt / Heaviest
  - [x] 🟩 Prior period on scoreboard rows so KPI % and a Tracking line (N up / N down · avg Volume · avg Effective) can paint
  - [x] 🟩 Keep Pack Volume bars and honor rolls; leave Home Daily weight chart as-is

- [x] 🟩 **Step 6: Live session after a set**
  - [x] 🟩 After a completed set, show Set Volume, Set Effective, Exercise Volume, Session Volume (Effective as the session sub)
  - [x] 🟩 Keep the sticky bar as Today Volume · Effective and All-time Volume · Effective

- [x] 🟩 **Step 7: Verify**
  - [x] 🟩 Home: KPI lead (window sums + last session minutes/sRPE) above 4 of 4 / Lock, More load, Daily, You vs, short performance fold
  - [x] 🟩 `/performance` Current / Progress / Filter on T-15 with Why lines and Hard sets
  - [x] 🟩 `/scoreboard` You vs + Pack Volume + cards with prior % and Tracking
  - [x] 🟩 Live tiles wired after a completed set (`LiveSetKpis`). Did not complete a set in the open Kevin session.
