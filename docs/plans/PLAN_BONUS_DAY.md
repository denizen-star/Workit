# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Add an optional Bonus Upper on weeks 3–6 (traps, lats, triceps, forearms, abs) that never nags and never counts as a fifth required day. Four completed sessions still lock the week. Reward the athlete: Master/Luna finish takeover, Home flag + tally (hidden when the week has no bonus), one badge with a live count, and a scoreboard honor roll (in-app + Monday mail in Master Tom Iron). Weeks 3–6 required days get small set/rep/note boosts so the month is not a copy of weeks 1–2. No week 7 or next-month program in this pass.

## Critical Decisions

- **Bonus is a day flag, not “week >= 3”:** `WorkoutDay.bonus`. Weeks 1–2 omit the day. Later programs can add or skip bonus without rewriting Home, badges, or the scoreboard.
- **Week lock = any 4 completed sessions:** Perfect week and week-complete use `>= 4`. Home / nudges / “next session” skip bonus days and skip leftover slots once the week is locked. Select Workout still shows Bonus.
- **Count once per week:** Unique weeks with a completed bonus session. Do Again does not increment.
- **Detect bonus by name + flag:** Day name / `workout_type` contains `Bonus` (e.g. `Bonus Upper`). Do not key off `day_number === 5` alone.
- **No calendar lock:** `suggestedDay` can stay Saturday as a hint. Home and the bonus card tell them to leave a day between upper sessions. Do not block Start. Lower the day after an upper is fine.
- **Required days keep the same lift names:** Weeks 3–6 change reps, one extra isolation set, notes, and ab/carry numbers only — so last-week weights and Vs the house still match.
- **Home flag:** This-week chip + program tally. Entire widget hidden when the current week has no bonus day. After the last bonus week, keep the tally if count > 0; drop the this-week chip.
- **Badge:** One `bonus_sessions` badge, unlock at 1, live count on the card.
- **Scoreboard:** Honor roll with counts for 7 / 30 / all. Celebration, not a second rank. Test hidden. Monday scoreboard email gets the same section in Master Tom Iron. In-app takeovers use both voices; Luna gets her own thank-you bank.
- **Out of scope:** Week 7, maintenance / mobility / progression blocks, changing main scoreboard rank, nagging the bonus.

## Bonus Upper (weeks 3–6)

| Exercise | Sets × reps |
|---|---|
| Dumbbell or Barbell Shrugs | 3 × 12–15 |
| Straight-Arm Pulldowns or Dumbbell Pullovers | 3 × 10–12 |
| Lying Triceps Extensions (Skull Crushers) | 3 × 10–12 |
| Hammer Curls | 3 × 10–12 |
| Reverse Wrist Curls | 3 × 12–15 |
| Dead Bugs (weeks 3–4) / Side Plank (weeks 5–6: 30s → 40s → 45s) | 3 sets |

Travel swaps for every new name.

## Required-day boosts

| Week | Change |
|---|---|
| 1–2 | Unchanged |
| 3 | Plank 60s. Hanging 12–15. Pallof 15/side. Farmer’s 50m. Compound notes: add 2.5–5 lb or 1–2 reps |
| 4 | Same abs/carries as week 3. +1 set on last accessory only: triceps, calves, curls, farmer’s |
| 5 | Isolations back to 3 sets. Pause / slow-lower notes on squat, RDL, lunges. Abs stay at week 3 hardness |
| 6 | Peak. 3 sets. Notes: match or beat week 4. Abs/carries stay hard |

## Tasks:

- [x] 🟩 **Step 1: Program data + bonus helpers**
  - [x] 🟩 Add `bonus?: boolean` on `WorkoutDay`. Helpers: `isBonusDay`, `weekHasBonus`, `weekLocked` (4 completed sessions), `bonusCount` (unique weeks).
  - [x] 🟩 Weeks 3–6: append `Bonus Upper` (`bonus: true`, suggested Saturday). Weeks 1–2 unchanged (no bonus day).
  - [x] 🟩 Apply week 3–6 required-day boosts (same names; sets/reps/notes only).
  - [x] 🟩 `findNextProgramDay` / `getTodayTarget`: skip bonus days; if the week is locked, advance to the next week’s first required day. Open bonus session still resumes.

- [x] 🟩 **Step 2: New lift plumbing**
  - [x] 🟩 Travel swaps in `lib/travelExercises.ts` for all six bonus names.
  - [x] 🟩 Images, videos, `exercises_table.md`, `exerciseKey` groups, and `exerciseKind` if a hold or bodyweight name needs it.
  - [x] 🟩 No session-schema migrate. PlanetScale `exercises` catalog only if we keep that table in sync by hand.

- [x] 🟩 **Step 3: Counts, labels, rest-between-uppers**
  - [x] 🟩 Select Workout + completed log: required denominator (`3/4`), not `days.length`. Label the extra day **Bonus**.
  - [x] 🟩 Home week cards and progress charts stay over 4. Optional `+ bonus` after they finish it. Cap bars at 4.
  - [x] 🟩 Perfect week badge: `COUNT(*) >= 4`.
  - [x] 🟩 Home + bonus card: leave a day between uppers if the last finished session was Upper A, B, or Bonus. Do not block Start.
  - [x] 🟩 Program Information copy: optional extra upper on weeks 3–6; four days still lock the week.

- [x] 🟩 **Step 4: Finish takeover + coach lines**
  - [x] 🟩 New `bonus_complete` line bank for Master and Luna (in-app). Finish API returns `bonus` + unique-week `bonusCount`.
  - [x] 🟩 `CompleteTakeover`: richer first screen when bonus (eyebrow, count). Then any new badge. Existing complete flow unchanged for required days.

- [x] 🟩 **Step 5: Home flag**
  - [x] 🟩 Widget only when `weekHasBonus` for the current / target week.
  - [x] 🟩 This-week chip (done / not yet) + program tally. After last bonus week: tally if count > 0, no this-week chip.

- [x] 🟩 **Step 6: Badge with live count**
  - [x] 🟩 `database/migrate-bonus-badge.sql`: one `bonus_sessions` row. Award at 1 (`awardIfNew`). Apply on PlanetScale by hand.
  - [x] 🟩 Achievements card shows live unique-week count after earn. `BadgeDisplay` label for the new type.

- [x] 🟩 **Step 7: Scoreboard honor roll + Monday mail**
  - [x] 🟩 `householdScoreboard`: bonus unique-week counts in the 7 / 30 / all window. Honor roll section under the main board. Empty state quiet. Hide Test.
  - [x] 🟩 Monday scoreboard email: same celebration, Master Tom Iron voice. Do not change main rank (workouts, then volume).

- [x] 🟩 **Step 8: Browser QA (Test, PIN 0000)**
  - [x] 🟩 Weeks 1–2: no bonus card, no Home flag.
  - [x] 🟩 Week 3+: Bonus on Select; Home Start is the next required day (1/4, not 1/5).
  - [x] 🟩 Rest-between-uppers copy on Home and the bonus card. Travel pill on Bonus Upper. Did not finish a bonus session (no extra Test sets).
  - [x] 🟩 Scoreboard 7/30/all opens. Honor roll hidden while nobody has a bonus week (quiet empty).
  - [x] 🟩 Did not log sets or start sessions as Kevin.
