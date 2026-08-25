# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Ship **Home Quiet** and the **You pages** (Your performance, Scoreboard, Completed log, Medals, About). Home’s job is start today’s workout plus a short progress summary. Everything else moves to the hamburger. **Visual identity does not change:** dark glass, gold `#e8c547`, cream `#f6f1e3`, existing `glass-card` / `gold-hero` / `glass-header`. Canvas was a map only.

Live app today: **4.0.0** (`package.json` / `CHANGELOG.md`). Release label in mail: **Home Quiet**.

## Critical Decisions

- **Identity locked:** Keep `#07070a` page, `#e8c547` titles / Start / you-row / chart-you, `#1a1404` on gold buttons, glass chrome, `/badges` SVGs. Green/red only for gain/loss. Do not apply canvas tokens, canvas blue House skin, or a new palette.
- **Home Quiet order:** Hero (Start + Select) → sentence → 4-day week lock → Daily weight 7/30/all → You vs Mike scan → flags (not cards) → folded Your performance → folded You / house.
- **You pages:** Menu destinations. Reuse existing boards; densify with one scan-card chrome. No new stats, no new APIs except widening daily weight windows already in `daily_stats`.
- **Out of this pass:** Start→end clocks, Enjoyment charts, weekly completion bars for empty weeks 3–6, hero travel line / rest-between-uppers / Completed / Restart as equal pills. Last / longest / total time vs house (avg time stays on Scoreboard). Nested By-workout lifts stay as today’s `AthletePerformance` already has them on the You page. Vs the house 3-cell boards live on Scoreboard, not Home.

## Tasks:

- [x] 🟩 **Step 1: Shared scan card (same chrome, existing colors)**
  - [x] 🟩 `components/ScanCard.tsx`: compact glass row — kicker + title left, headline right, 3- or 4-col metric grid, optional gold foot. You-row uses gold border/`bg-[#e8c547]/10` like today’s scoreboard first-place card. No new colors.
  - [x] 🟩 Use it for Scoreboard people, Your performance summary, lift rows, You / house, You vs Mike.

- [x] 🟩 **Step 2: App menu + You routes**
  - [x] 🟩 `AppMenu`: athlete links before Edit profile — Your performance, Scoreboard, Completed log (`/history`), Medals, About. Gold labels like admin rows. Middleware already gates logged-in pages.
  - [x] 🟩 `app/performance/page.tsx`: existing `AthletePerformance` as the page (15/30/all). Dense scan cards. Gainers/losers open; every lift folded. Keep nested By workout.
  - [x] 🟩 `app/scoreboard/page.tsx`: existing `HouseholdScoreboard` + `ExerciseCompare` (hidden for Test). Dense person cards. Keep 7/30/all, Tom line, last workout, honor rolls.
  - [x] 🟩 `app/medals/page.tsx`: existing `BadgeDisplay` (descriptions, dates, requirements, bonus/optional counts).
  - [x] 🟩 `app/about/page.tsx`: Program Information block moved off Home (split graphic + overload copy).
  - [x] 🟩 Shared You-page chrome: `glass-header`, Dashboard back, `AppMenu`, gold title — same as `/history`.

- [x] 🟩 **Step 3: Home Quiet**
  - [x] 🟩 Header: logo + menu only. Drop duplicate header Start/Select.
  - [x] 🟩 Hero: Today / week·day / focus / est. Start + Select only. Completed lives in the menu. Restart as a small text action, not a fourth pill.
  - [x] 🟩 Sentence: `X of 24 days. Y lb all-time.` plus last-7 note when it matches.
  - [x] 🟩 4-day week lock under the sentence (1 of 4, four day slots: Done / Now / —).
  - [x] 🟩 Daily weight on Home with 7/30/all pills. You = gold, house avg = existing cream series (not a new blue). Drop the 6-week completion chart from Home. `GET /api/stats` already returns 30 daily rows; All may need that limit lifted for this athlete only.
  - [x] 🟩 You vs Mike (or current leader) scan from scoreboard numbers. Not the full board.
  - [x] 🟩 Bonus + Optional as a flag strip (status + counts), not glass cards.
  - [x] 🟩 Folded **Your performance** trailing `N up · M down` (hide for Test). Folded **You / house**: workouts, calendar streak, total weight, medals x of y — you first, house second.
  - [x] 🟩 Remove from Home: full Scoreboard, Vs the house, full Your performance, weekly 6 tiles, completed log, timing cards, enjoyment, achievements grid, program info.

- [x] 🟩 **Step 4: Completed log polish**
  - [x] 🟩 `/history` already exists. Menu points here. Best-day session gets a gold chip. No identity change.

- [x] 🟩 **Step 5: Browser QA (Test, PIN 0000)**
  - [x] 🟩 Quiet Home: start/select, week lock, chart pills, flags, both folds. Gold/glass unchanged vs workout + who.
  - [x] 🟩 Menu → each You page. Scoreboard 7/30/all. Performance 15/30/all. Medals grid. About copy. Log Best day chip.
  - [x] 🟩 Test still hidden from Vs the house / Your performance.
  - [x] 🟩 Did not log sets or start sessions as Kevin.
