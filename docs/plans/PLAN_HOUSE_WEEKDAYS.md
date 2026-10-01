# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

On The house, under the period pills and above You vs, show the signed-in athlete’s finished workouts by weekday, plus a House row of averages rounded up. Same seven boxes for every period. Test is left out.

## Critical Decisions

- **Two rows, same for every account.** Own row, then House. Kevin does not see other athletes. The API returns only the caller and the already-rounded house figures.
- **Own row.** Real name. Number beside the name is total finished workouts. Seven boxes, **M T W T F S S**, count inside each. Green (`#6d8b6e`) when the count is at least 1, dim at 0. Row stays up at zero. Opening it lists `workout_type` with a count. The House row does not open.
- **House row.** Number beside House is the average total, rounded up (`Math.ceil`). Each box is that weekday’s average, rounded up on its own. Divisor is athletes in this house with at least one finished workout in the period. A zero on one weekday stays in the divisor. Nobody active → zeros. Test is not in the divisor.
- **Period.** **7d** is this Eastern calendar week, Monday 00:00 through Sunday, so a weekday still ahead is 0. **30d** and **All time** use the existing house window and add each finished workout into its Eastern weekday.
- **What counts.** `is_completed = 1` in the current house. Test Drive sessions stay off, same as the rest of this page. Open sessions do not count. Two workouts on one weekday both count.
- **Test signed in.** The block is absent.

## Tasks:

- [x] 🟩 **Step 1: Weekday fold**
  - [x] 🟩 Add a helper that, for a house and a scoreboard period, loads finished sessions and buckets them Monday–Sunday in Eastern time.
  - [x] 🟩 Build the caller’s total, seven day counts, and workout-name counts. Build the house averages with `Math.ceil`. Return nothing for Test.

- [x] 🟩 **Step 2: Scoreboard payload**
  - [x] 🟩 Attach that payload to `GET /api/scoreboard` for the same `period` query. Do not add another route.
  - [x] 🟩 Omit every other athlete’s name and counts.

- [x] 🟩 **Step 3: The house UI**
  - [x] 🟩 Render the two rows in `app/scoreboard/page.tsx` after the period pills and before You vs. Hide the block when the payload is absent.
  - [x] 🟩 Refetch when the pill changes. Own row opens to the grouped workout list. House row stays closed.
  - [x] 🟩 Tiny weekday letters above the boxes. Green or dim from the number shown.

- [x] 🟩 **Step 4: Page note**
  - [x] 🟩 Add the block to the `/scoreboard` section in `docs/PAGE_SECTIONS.md`.
