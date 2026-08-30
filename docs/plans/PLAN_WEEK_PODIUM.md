# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Award gold / silver / bronze for each **closed Eastern Mon–Sun week** using The house rank (days, then lb, then the same tie-breaks). Store every week’s 1 / 2 / 3. After Sunday, first Home open that week is a celebration takeover **only if you placed**. Hero then shows **your** medal only. History on `/medals`. Current in-progress week never counts. Test out. Kevin in. Zero-session athletes out.

## Critical Decisions

- **Week = calendar, not program.** `easternMondayKey` / Mon–Sun. The week the athlete is still in is ignored. A week locks when Sunday ends (Monday 00:00 Eastern).
- **Backfill two closed Sundays.** On first compute, persist the two most recent **closed** Eastern weeks only. Do not write a row for the current week.
- **Rank = The house.** Finished sessions that week, then volume (completed sets + optional lb), then best session, heaviest, name. Unique places. Two athletes → 1st and 2nd only.
- **Pool.** Active that week = at least one completed session in that Mon–Sun window. `SQL_EXCLUDE_TEST_USER`. Kevin included.
- **New table, not `user_badges`.** `(user_id, badge_id)` is unique; weekly medals repeat. Hand SQL migrate, apply on PlanetScale.
- **Compute on read.** First authenticated GET after a week closes inserts missing podium rows (same pattern as `checkAndAwardBadges`). No new cron.
- **Takeover once.** First Home open after that Monday, **placers only** (1 / 2 / 3). Coach celebration line (Tom / Grey / Luna). Seen flag: `localStorage` keyed by user id + week Monday (matches existing client prefs).
- **Hero.** Gold / silver / bronze mark for **you** if you placed last closed week. No place → render nothing. Keep BeltChest and You vs leader.
- **Medals page.** List your stored weekly medals (date + place). Do not add three static `badges` catalog rows.
- **Out of scope.** Mail, scoreboard honor-roll change, You vs leader replacement, tying vacant places, Test competing.

## Tasks:

- [x] 🟩 **Step 1: Week window + rank helper**
  - [x] 🟩 Closed-week keys: last N Eastern Mondays whose Sunday has already ended. Current week excluded.
  - [x] 🟩 Rank athletes for one Monday key with the same sort as `householdScoreboard`, scoped to that Mon–Sun and excluding Test / zero sessions.
  - [x] 🟩 Keep the helper in `lib/` so Home, medals, and the API share one path.

- [x] 🟩 **Step 2: Persist podium**
  - [x] 🟩 `database/migrate-week-podium.sql`: table keyed by week Monday + place (1–3), user, days, volume, unique `(week_monday, place)`.
  - [x] 🟩 On GET: if a closed week has no rows, compute and insert. First call also fills the two latest closed weeks.
  - [x] 🟩 Note in `CLAUDE.md` that the migrate is hand-applied (re-run = duplicate table).

- [x] 🟩 **Step 3: API**
  - [x] 🟩 Session-gated `GET /api/week-podium` returns last closed week, **your** place if 1–3, and weekly medal history.
  - [x] 🟩 Test user gets history empty / no place (they never rank).

- [x] 🟩 **Step 4: Coach celebration lines**
  - [x] 🟩 New buckets `week_place_1` / `week_place_2` / `week_place_3` for master, james, luna.
  - [x] 🟩 Fallback packs in `lib/coachLines.ts` / catalog hydrate. Hand SQL migrate for `coach_lines`.
  - [x] 🟩 Celebration only. Address **man**. Follow each voice’s existing register.

- [x] 🟩 **Step 5: Home takeover + hero medal**
  - [x] 🟩 First open after Monday: takeover for placers only. Line + gold / silver / bronze. Dismiss writes the seen key.
  - [x] 🟩 Hero: simple gold / silver / bronze if you placed last closed week; otherwise nothing.
  - [x] 🟩 Do not change Start / BeltChest / WeekLock / You vs leader.

- [x] 🟩 **Step 6: `/medals` history**
  - [x] 🟩 Section on the medals page: your weekly gold / silver / bronze with the week date. Empty if none.

- [x] 🟩 **Step 7: Verify**
  - [x] 🟩 Browser as **Test** (PIN `0000`): no podium, no takeover, no hero medal.
  - [x] 🟩 Confirm API shape for a closed week (`weekMonday` 2026-08-17, `you` null, empty history). Persist waits on hand SQL.
