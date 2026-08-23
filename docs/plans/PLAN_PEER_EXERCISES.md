# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Show each athlete which **exercises** they lead, trail, or sit with the pack — best-day total for that movement, not whole-workout volume. Home shows only your three cells. Admin analytics shows every athlete except Test. Fix timed/distance volume to `weight × 1` on live totals. Include you in household averages; leave Test out.

## Critical Decisions

- **Home vs admin:** `/home` next to Scoreboard = logged-in athlete’s three cells only, Scoreboard **7 / 30 / All** pills (default 7). `/admin/analytics` = one row per athlete except Test, same three columns, follows the page’s existing Analytics range.
- **Per-exercise number:** For each person × movement (`exerciseHistoryKey`), sum completed sets in one workout, then take the **max** of those session sums. Cell prints canonical gym name, that lb total, **that workout’s date**, percent, peer name, and the **peer’s total + date**.
- **Lead / deficit / similar:** Lead = largest % over the next-best named peer (dash if they lead nothing). Deficit = largest % behind the household best, name that peer (dash if nobody is ahead). Similar = closest to household mean of best days; lowest CV breaks ties. Need **≥2** non-Test athletes on that movement. Timed and distance **out** of these three cells. Drop 0 lb sets.
- **Test:** Out altogether — not a peer, not in household averages, no Home block, no admin row. Logging in as Test does not show this table.
- **Household cards:** Existing you / household numbers **include the viewer** and exclude Test. Scoreboard roster unchanged except the volume formula.
- **Volume formula (live queries + new `daily_stats` writes only):** timed and Farmer’s / distance use `weight × 1`. Weighted stays `weight × reps`. **No** `daily_stats` backfill.

## Tasks:

- [x] 🟩 **Step 1: Shared volume + Test + household pool**
  - [x] 🟩 Add a small helper next to `lib/exerciseKind.ts`: set volume is `weight × 1` for timed/distance, else `weight × reps`. Use it in Scoreboard, `GET /api/stats`, `householdHomeStats`, badges, recap/scoreboard mail, and `updateDailyStats` writes.
  - [x] 🟩 Treat name `Test` (case-insensitive) as excluded from household averages and from this comparison.
  - [x] 🟩 Change `householdHomeStats` so the viewer is **in** the household average (stop `user_id != ?`). Still only peers who finished a workout in the last 7 days, minus Test.

- [x] 🟩 **Step 2: Comparison math**
  - [x] 🟩 `lib` function: load completed sets in a date window (completed sessions only), skip Test, skip timed/distance, skip 0 lb, group by `exerciseHistoryKey`, compute each user’s best session sum + session date.
  - [x] 🟩 From that grid, compute lead / deficit / similar per athlete (rules in Critical Decisions). Canonical display name = first gym name in the alias group.

- [x] 🟩 **Step 3: Home API + three cells**
  - [x] 🟩 Read `node_modules/next/dist/docs/` before adding the route.
  - [x] 🟩 Session-gated `GET` (e.g. `/api/exercise-compare?period=7|30|all`): current user only. Empty/hidden payload if the user is Test.
  - [x] 🟩 Component on `/home` next to `HouseholdScoreboard`: three cells, same period pills as Scoreboard. Do not render for Test.

- [x] 🟩 **Step 4: Admin all-athlete table**
  - [x] 🟩 Same math for every non-Test athlete. Window from the Analytics range already selected on `/admin/analytics` (`today` / `yesterday` / `7d` / `30d` / `mom` / `all` in `lib/analyticsTime.ts`).
  - [x] 🟩 Table on `/admin/analytics`: athlete name + lead / deficit / similar cells (same fields as Home). `requireAdmin`.

- [x] 🟩 **Step 5: Verify**
  - [x] 🟩 Browser as Test: no Home block; `GET /api/exercise-compare?period=7` returns `{ hidden: true }`; admin `?range=` is 403. Live compare (all-time) returns Christine, Kevin, Mike, Peter — no Test. Christine lead is a dash.
  - [x] 🟩 Timed/distance use `setVolume` / `sqlSetVolume` on live totals. Old `daily_stats` rows left as-is.
