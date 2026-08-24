# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Add an **Optional** warmup and **Optional** cooldown on every session (gym, travel, Bonus Upper). Each is a start/end button, a short easy circuit (run / bike / stretch / core), and a 10-minute wall-clock timer. Finish pays **+500 lb** per slot. Four warmups + four cooldowns in the household 7-day Scoreboard window pays a **25% gap kicker** toward that window’s total-weight leader. Lbs count on Scoreboard volume, Vs the house Total weight, Home, recap, and badges. Best day stays lifts only. Celebrate: takeover, coach line, Home chip, two badges, honor roll.

## Critical Decisions

- **Name:** Optional / Optionals. Do not call it bonus (Bonus Upper already owns that).
- **Not a gate:** Optional button at the start (warmup) and end (cooldown). Lifts are never locked. Skip = do not tap.
- **Every session:** Same extras on required days, Bonus Upper, and travel.
- **Tracks:** Easy run, Easy bike, Easy stretch, Easy core. Warmup and cooldown are different circuits. Travel-safe copy. Run/bike cues rotate until the 10-minute clock hits zero. Stretch/core are five holds with stills + video; Done on the last hold credits +500 without waiting out the clock.
- **Timer:** Run/bike: 10 minutes must elapse to earn lbs. Stretch/core: last Done credits immediately (`circuitComplete`); 10-minute clock is fallback if they stop mid-circuit. Wall clock (`Date.now()`), keeps running if the phone locks or they leave the app. No pause.
- **Flat lbs:** +500 warmup, +500 cooldown. Store track + completed_at + awarded lbs on `workout_sessions`. Do not insert fake `exercise_sets`.
- **Kicker:** First time the athlete hits 4 warmups + 4 cooldowns in the current 7-day Scoreboard window, award `0.25 * remaining gap` to that window’s total-weight leader (after this session’s 500s). Freeze on that session. One kicker per 7-day window. Passing the leader is allowed.
- **Boards:** Optional lbs + kicker add to Scoreboard volume, Vs the house Total weight, Home stats, recap mail, `daily_stats`, and weight badges. **Best day and per-lift Vs the house cells stay iron only.**
- **Honor roll:** Unique program weeks with ≥4 warmup and ≥4 cooldown in the 7 / 30 / all window. Same shape as Bonus weeks. Test hidden. Monday scoreboard mail gets the same section.
- **Badges:** `optional_weeks` unlock at 1, live unique-week count. `optionals` unlock at 1, live count of finished warmup + cooldown slots.
- **Out of scope:** Pause, nagging, changing Best day, gating lifts, catch-up vs program week.

## Sequences (easy, non-threatening)

Warmup and cooldown each have four tracks. Copy stays light. Run/bike repeat until time is up. Stretch/core are five holds; last Done credits.

| Track | Warmup | Cooldown |
|---|---|---|
| Easy run | Easy jog, tall posture, easy breath | Easy jog or walk it down, shake the legs |
| Easy bike | Easy spin, loose shoulders, easy breath | Easy spin, unclench, slow the legs |
| Easy stretch | Neck, shoulders, chest, hips, calves | Hamstrings, quads, chest, hips, calves |
| Easy core | Dead bug, easy plank, heel taps, glute bridge, superman | Dead bug, easy crunch, glute bridge, cat-cow, breathe down |

## Tasks:

- [x] 🟩 **Step 1: Data + helpers**
  - [x] 🟩 `database/migrate-optionals.sql`: session columns for warmup/cooldown track, completed_at, awarded lbs, kicker lbs. Apply on PlanetScale by hand.
  - [x] 🟩 `lib/optionals.ts`: 500 lb constant, 10-minute duration, track ids, warmup/cooldown circuits, 4+4 helpers, 25% kicker (7-day window, freeze once).
  - [x] 🟩 Volume helper used by Scoreboard, stats, recap, badges, `daily_stats`, and Vs the house **Total weight** only.

- [x] 🟩 **Step 2: Complete Optional API**
  - [x] 🟩 Session-gated POST (warmup or cooldown): require open session, require 10 minutes elapsed server-side, write track + lbs, maybe kicker, return awarded lbs + kicker.
  - [x] 🟩 Resume: GET session already returns `SELECT *`; expose Optional fields to the workout page.

- [x] 🟩 **Step 3: Workout UI**
  - [x] 🟩 Optional button at the top and bottom of the live workout (not on Select). Pick a track → guided steps + 10-minute clock → credit on finish.
  - [x] 🟩 Clock uses wall time so lock / background still counts. Wake lock already on during the session.
  - [x] 🟩 Done state on the button (track + 500 lb). Cannot double-claim.

- [x] 🟩 **Step 4: Finish takeover + coach lines**
  - [x] 🟩 `optional_complete` line bank for Master and Luna (code fallback + `database/migrate-optional-coach-lines.sql`).
  - [x] 🟩 Finish PUT returns Optional lbs + kicker. `CompleteTakeover` shows them when > 0.

- [x] 🟩 **Step 5: Home chip + two badges**
  - [x] 🟩 Home chip: this-week warmup/cooldown counts + program Optional-week tally.
  - [x] 🟩 `database/migrate-optional-badges.sql`: `optional_weeks` and `optionals`, both unlock at 1. Apply on PlanetScale by hand.
  - [x] 🟩 Award in `checkAndAwardBadges`. Achievements show both live counts.

- [x] 🟩 **Step 6: Scoreboard honor + Monday mail**
  - [x] 🟩 Honor roll under Bonus weeks: unique Optional weeks in 7 / 30 / all. Quiet empty. Hide Test.
  - [x] 🟩 Monday scoreboard email: same section, Master Tom Iron. Rank rule unchanged (workouts, then volume — volume now includes Optional lbs).

- [x] 🟩 **Step 7: Browser QA (Test, PIN 0000)**
  - [x] 🟩 Optional buttons on a live session (including travel + Bonus Upper). Skip still lets you lift and Finish.
  - [x] 🟩 Timer keeps counting after lock / leave. Run/bike credit after 10 minutes. Stretch/core credit on last Done. No second credit.
  - [x] 🟩 Home chip, Achievements, Scoreboard honor, Vs the house Total weight (Best day unchanged).
  - [x] 🟩 Did not log sets or start sessions as Kevin.
