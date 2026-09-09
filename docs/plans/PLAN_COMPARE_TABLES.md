# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

**You vs** is You | Last | them (House if you are alone). Window is **7d / 30d / All time**. Recap **G**, honor **J**, ranking **K**, session stories **N**, and optionals **R** use the same compare table. Week lock / week performance tiles stay. `/performance` lift cards, charts, medals, gym/travel, live OptionalCard, recap mail stay.

Look reference: `docs/plans/comparison-table-preview.html`.

## Critical Decisions

- **You vs:** Cream You, muted Last, copper them. Always three columns. Alone: third column is House. Pills **Next** + up/down SVG, plus House. Next ranks **this house** (everyone in, Test out), including zeros. Last = last time you posted those numbers. `%` under You vs Last; `%` under them = you vs them. The house page: one pill row drives You vs + pack + cards. Home You vs has its own pills. Home folds under Daily weight start closed.
- **J:** Bonus, optionals, optional lbs, run+bike are rows on You vs. No gold honor cards.
- **K:** Place and Best day are rows on You vs. Household people cards stay.
- **G:** Finish recap is This | Last per exercise. Same table on Home Session stories for last session.
- **N:** Session stories “What moved” is one This | Last table (session volume, best lift, lifts down, week volume).
- **R:** Recap adds Warmup / Cooldown / Optional lbs. Live OptionalCard stays. n/8 stays under week lock.
- **Stay:** No `/performance` Last line. No week-medals restyle. No gym/travel matrix. Charts stay. Recap **email** unchanged.

## Tasks:

- [x] 🟩 **Step 1: Shared compare table**
- [x] 🟩 **Step 2: You vs · 3 columns** (`YouVsLeader`)
  - [x] 🟩 Always You | Last | them. House fills the third column when there is no next.
  - [x] 🟩 Honor rows (J). Place + Best day (K).
  - [x] 🟩 7d / 30d / All time. Next = current-house members (`GET /api/scoreboard` `members`).
- [x] 🟩 **Step 3: Week lock tiles**
- [x] 🟩 **Step 4: Week performance tiles**
- [x] 🟩 **Step 5: G recap** per exercise + R warmup / cooldown / optional lbs
- [x] 🟩 **Step 6: N session stories** This | Last last-session lifts + What moved
- [x] 🟩 **Step 7: Copy** Home folds under Daily weight start closed.
