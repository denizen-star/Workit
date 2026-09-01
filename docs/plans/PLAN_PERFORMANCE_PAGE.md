# Feature Implementation Plan

**Overall Progress:** `90%`

## TLDR

Re-order **Your performance** from summary to detail, put Bonus + Optional at the bottom as one additive strip, and give Kevin a multi-athlete dropdown that folds selected people into the same cards. Period pills become Eastern-calendar **T / T-1 / T-7 / T-15 / T-30 / All** everywhere those pills already exist. Home fold and Admin Athletes keep their current section order.

## Critical Decisions

- **Page-only layout:** `/performance` gets the new section order and Kevin filter. Home fold and Admin Athletes keep today’s section order (`AthletePerformanceBoardView` stays on the old path via a `page` / layout flag or a page-only view).
- **One board, not stacked:** Kevin’s filter sums into the existing cards. Empty filter = empty. Default = logged-in athlete. Test is in the picker.
- **Combine rules:** sum This weight / This total; recalc pack % on summed this vs last; add each person’s summary counts; How hard = set-weighted average.
- **Bonus vs optional:** Bonus days stay **all-time** (unique weeks per person, then add). Warmups, cooldowns, and optional weeks follow the **period** (then add). Label is **Bonus done** only.
- **Eastern pills everywhere PeriodPills exist:** T = today; T-1 = yesterday only; T-7 / T-15 / T-30 = last N Eastern days including today; All = no cut. Default **T**. Keep accepting `15` / `30` as T-15 / T-30.
- **Prior still allowed outside the window:** same as today — “vs last time” can be a session before T / T-7 / etc.

## Tasks:

- [x] 🟩 **Step 1: Eastern periods**
  - [x] 🟩 Read `node_modules/next/dist/docs/` before changing client pages.
  - [x] 🟩 Extend `PERFORMANCE_PERIODS` / `isPerformancePeriod` / `performanceRangeLabel` in `lib/athletePerformanceTypes.ts` to `t` | `t-1` | `t-7` | `t-15` | `t-30` | `all`. Map legacy `15` → T-15, `30` → T-30.
  - [x] 🟩 Replace rolling `Date.now() - N days` in `periodStartMs` with Eastern calendar windows (`easternYmd` / `easternMidnightUtc` / same helpers as `lib/whoRoster.ts`). T and T-1 are single Eastern days.
  - [x] 🟩 Update `PeriodPills` labels and grid for six options. Default state **T** on Home fold, `/performance`, and Admin Athletes.

- [x] 🟩 **Step 2: Split difficulty + page section order**
  - [x] 🟩 Split `HardnessCharts` into by-workout vs by-lift (or props to show one). Household charts on Admin stay one block, old order.
  - [x] 🟩 Add a page-only board layout: Summary → Difficulty by workout → By workout (folded) → Gainers / Losers (open) → Difficulty by lift + Every lift (folded). Home `page={false}` and Admin `AthletePerformanceBoardView` keep today’s order.
  - [x] 🟩 Move `FlagStrip` from the top of `app/performance/page.tsx` to after the board.

- [x] 🟩 **Step 3: Combine boards + Kevin filter**
  - [x] 🟩 Pure merge helper (same file family as `lib/athletePerformance.ts`): match lifts / workouts by existing keys; sum weights and volumes; recalc `%` with `pctChange`; add summary counts; hardness = `perceptionSum / perceptionCount`.
  - [x] 🟩 `householdAthletePerformance` (or a page-only query): include **Test**. Kevin on `/performance` loads household rows; non-admin still `GET /api/athlete-performance?period=`.
  - [x] 🟩 Dropdown with checkboxes + **Check all**. Start with the logged-in id checked. Uncheck all → empty. No Clear.
  - [x] 🟩 Render `merge(selected rows)` through the new page layout. Non-Kevin: no dropdown.

- [x] 🟩 **Step 4: Bonus + Optional strip**
  - [x] 🟩 `FlagStrip` accepts period + optional session lists (or fetches `/api/sessions` per selected id when Kevin). One widget.
  - [x] 🟩 Bonus: `bonusCount` all-time per person, then add. Copy is **Bonus done** + summed days. No still-open / Week N.
  - [x] 🟩 Warmups / cooldowns: slots finished in the period window, summed. Optional weeks: each person’s 4+4 weeks that finish in the window, then add.
  - [x] 🟩 Non-Kevin: same strip rules on their own sessions.

- [ ] 🟨 **Step 5: Verify**
  - [x] 🟩 `tsc --noEmit` clean. `/who` loads. Full click-through as Test / Kevin still needs a logged-in session in the browser.
  - [ ] 🟨 `/performance` as Test: order, pills, no filter, empty T if no finish today, T-15 still fills.
  - [ ] 🟥 `/performance` as Kevin: default self; Check all including Test; empty filter; additive cards and strip.
  - [ ] 🟥 Home fold + Admin Athletes: old section order, new six pills, default T.
  - [ ] 🟥 Do not start or log sessions as Kevin.
