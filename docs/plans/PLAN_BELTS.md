# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Turn Work-It into a 48-week year with belt diplomas. Weeks 1 to 6 stay the current 4-day upper/lower (plus bonus on 3 to 6). From week 7, one lower day alternates A/B, Friday is a rotating extra upper, and bonus is logged core or an untracked class that still counts. Athletes always see which belt they are after and how many locked weeks they have. Existing locked weeks already in the house count.

## Critical Decisions

- **A week counts when it has 4 finished sessions.** Gaps count. Three sessions never lose the week. Home stays on that week until 4. Bonus (core or "I did yoga") can be the fourth. No new catchup workout type.
- **Weeks 7 to 48 are generated from templates**, not 42 pasted copies. Odd week: Lower A. Even week: Lower B. Extra-upper pack index = floor((week - 7) / 6). Block notes + How hard bands are copy only.
- **Compounds stay.** Extra upper and bonus are what rotate so people do not get bored.
- **Belts are not medals.** `/belts` is for everyone: aiming copy, house pack, and the Before / During / After glossary. Badge table unchanged.
- **Current belt wash on every live session.** Light treatment so glass cards stay readable. Cream and pale yellow stays a tint, not a flood. New belt unlock also colors the finish takeover.
- **No copper and no app gold as belt fills.** Arnold trim `#e8c547` is the one gold exception.
- **After 48 locked weeks:** out of scope. Keep training, keep Arnold, decide reset later.
- **Copy:** no em dashes. Quote, attribution name, then coach line.
- **Mail:** Recap shows locked-week progress plus the next (or current) belt SVG. Crossing 2 / 6 / 10 / 20 / 24 / 48 sends a diploma email (SVG + quote + coach line). Medal emails include the badge SVG. Scoreboard mail names the belt. No backfill for belts already earned.

## Tasks

- [x] 🟩 **Step 1: Belt and week helpers**
  - [x] 🟩 `lib/belts.ts` plus streak walks the full program.
- [x] 🟩 **Step 2: 48-week program data**
  - [x] 🟩 Weeks 1 to 6 unchanged. Weeks 7 to 48 generated. Extra-upper packs. Bonus Core. About program updated.
- [x] 🟩 **Step 3: Bonus something-else**
  - [x] 🟩 Week 7+ bonus start: logged core or searchable / free-type activity. Completing the activity finishes a bonus session.
- [x] 🟩 **Step 4: `/belts` + nav**
  - [x] 🟩 Live aiming + pack + the three-state glossary. Menu link. Test included.
- [x] 🟩 **Step 5: Home, scoreboard, live wash**
  - [x] 🟩 Home chip + progress. House belt column. Live wash. Diploma takeover.
- [x] 🟩 **Step 6: Admin + API + mail**
  - [x] 🟩 `GET /api/belts`. Admin athletes chips. Recap / diploma / medal SVG / scoreboard belt.
- [x] 🟩 **Step 7: Browser check**
  - [x] 🟩 `/belts`, Home, About, Select week 7 (Extra Upper + Bonus Core picker), scoreboard names.
