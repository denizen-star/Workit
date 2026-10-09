# Fewer DB calls

**Overall Progress:** `100%`

## TLDR
A Home load today makes 9 API calls and about 61 database queries (measured 2026-10-09 as Test). 18 of those queries are sign-in repeats, and several tables are read more than once. This plan cuts those queries in the order agreed: four small, low-risk fixes first, then one call for both More programs, then a single Home call. Athletes should see no change except speed.

## Critical Decisions
- **Order:** sign-in, `/api/me`, athlete-performance and Medals first (small, independent, low risk); then Hyrox + Overload in one call; then the single Home call as its own step.
- **Sign-in stays 2 reads until this plan changes it, and then becomes 1:** the user row and their houses are read in one query. Same select modes, same `blocked_at` guard, same house choice.
- **Medals stops awarding on read:** Finish (and mark-complete) already award badges, so `GET /api/badges` only reads.
- **The single Home call reuses the existing helpers:** `/api/home` calls the same functions the separate routes call, signs in once, and loads shared data (such as locked weeks) once. The old routes stay for the other pages that use them.
- **The house-average cache (`/api/stats` item 6) is out of scope.** It wasn't in the agreed order.
- **Checking:** one typecheck per step, plus a query count per step using the same temporary query log as the 2026-10-09 measurement (log removed after).

## Tasks:

- [x] 🟩 **Step 1: Sign-in in one query (item 3)**
  - [x] 🟩 `selectUserRow` + `householdForUser` (`lib/auth.ts`, `lib/household.ts`) read the user row and their houses in one query
  - [x] 🟩 Keep the select-mode fallback ladder and the `guard` (`blocked_at`) behavior unchanged
  - [x] 🟩 Check: every authenticated call drops from 2 sign-in queries to 1

- [x] 🟩 **Step 2: `/api/me` reads houses once (item 4)**
  - [x] 🟩 `GET /api/me` reuses the house list sign-in already loaded instead of calling `listHouseholdsForUser` again
  - [x] 🟩 Check: `/api/me` 4 → 2 queries

- [x] 🟩 **Step 3: athlete-performance repeats (item 5)**
  - [x] 🟩 Load `lockedWeeksByUserFromTable` and `lastWorkoutByUser` once per request and share them between the house board and the empty-snapshot path
  - [x] 🟩 Scope the snapshot's house board to the athlete's own house (`user.householdId`)
  - [x] 🟩 Check: `/api/athlete-performance?period=t-15` 13 → about 10 queries; same place and rank shown for an athlete in a one-house setup

- [x] 🟩 **Step 4: Medals reads only (item 7)**
  - [x] 🟩 Remove `checkAndAwardBadges` from `GET /api/badges`
  - [x] 🟩 Load the bonus-week and optional-week counts once (they're queried twice today)
  - [x] 🟩 Check: `/api/badges` 19 → about 5 queries; the Medals page shows the same badges and counts

- [x] 🟩 **Step 5: One call for More programs (item 2)**
  - [x] 🟩 Add `GET /api/programs` returning both programs' state in one response, reading the shared parts once (locked main weeks, 6th-week lock date, banner seen)
  - [x] 🟩 Home, the workout page and `ProgramTrackHome` use it; `POST /api/hyrox` and `POST /api/overload` actions stay as they are
  - [x] 🟩 Remove `GET /api/hyrox` and `GET /api/overload` once nothing calls them
  - [x] 🟩 Check: 16 → about 8 queries and one fewer call on Home

- [x] 🟩 **Step 6: Single Home call (item 1)**
  - [x] 🟩 Add `GET /api/home`: one sign-in, then profile, sessions (`home=1` behavior), coach catalog, programs, stats (`home=1`), week podium and the shared performance board, with locked weeks loaded once and passed to each part
  - [x] 🟩 Home makes one call instead of nine; the hold line stays its own call (it depends on today's target)
  - [x] 🟩 Keep each existing route for the other pages that call it
  - [x] 🟩 Check: Home load ~61 queries / 9 calls → measured count / 2 calls; same Home content as Test

- [x] 🟩 **Step 7: Docs**
  - [x] 🟩 Update CLAUDE.md (sign-in read, `/api/me`, `/api/badges` no longer awards, `/api/programs`, `/api/home`) and fix the stale "badges fill in after" line in Home's description
