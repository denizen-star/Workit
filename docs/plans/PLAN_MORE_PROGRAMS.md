# Feature Implementation Plan — More programs menu + 3-day banners

**Overall Progress:** `100%` — lint (no new issues), build and API pass as Test green 2026-09-27; visual click-through of the menu section and banners still to do.

## TLDR
Hyrox and Overload Progressions banners currently sit on Home forever once an athlete is eligible (Hyrox's "seen" flag is localStorage and the seen banner renders identically; Overload has no dismiss at all). Move both programs into a **More programs** section in Home's menu (above Your performance), shown locked with a lock icon until unlocked, and cut each banner down to: until tapped, ✕'d, or 3 days after unlocking — whichever comes first. Seen state moves to the database.

## Critical Decisions
- **Same unlock rule for both: 6 locked main weeks** — "same timeline, don't complicate it". Overload's gate changes from "week 6 itself locked" (`mainWeekLocked(user, 6)`) to `lockedMainWeekCount >= 6`, matching Hyrox (`HYROX_ELIGIBLE_LOCKED_WEEKS`). One hint ("Unlocks after 6 locked weeks") and one progress line ("N of 6 weeks locked") for both.
- **Unlock date = `locked_at` of the athlete's 6th locked main week** (`locked_weeks`, weeks 1–48) — real data, no new column.
- **3-day window starts at the later of unlock date and a `MORE_PROGRAMS_RELEASE` constant** — gives already-eligible athletes a one-time 3-day window from this release (backfilled `locked_at` values are all the migration date).
- **Seen state in the DB via `week_takeover_seen`** — new kinds `banner_hyrox` / `banner_overload` (fit `VARCHAR(16)`), `week_monday` = the release date as a fixed sentinel. Reuses `hasSeenWeekTakeover` / mark-seen in `lib/weekPodium.ts`; no migration.
- **Home's menu only** — other pages keep not passing the program props to `AppMenu`.
- **Leave stays in the menu footer**; while one program is active the other's item is hidden entirely (unchanged rule).
- Tapping a banner still opens the program's intro takeover (and marks it seen).

## Tasks:

- [x] 🟩 **Step 1: Shared unlock rule + banner window (server)**
  - [x] 🟩 New `lib/moreProgramsUnlock.ts`: `PROGRAM_UNLOCK_LOCKED_WEEKS = 6`, `MORE_PROGRAMS_RELEASE`, `BANNER_DAYS = 3`, `programUnlockInfo(userId)` → `{ lockedWeeks, eligible, unlockedAt }` (unlockedAt = 6th main `locked_at`), `bannerDue(unlockedAt, seen, now)`
  - [x] 🟩 `overloadEligible` (`lib/overloadState.ts`) uses the 6-locked-main-weeks rule; `hyroxEligible` points at the same constant
  - [x] 🟩 Extend `WeekTakeoverKind` with `banner_hyrox` / `banner_overload`

- [x] 🟩 **Step 2: API fields**
  - [x] 🟩 `GET /api/hyrox` and `GET /api/overload` add `lockedWeeks` (for "N of 6") and `bannerDue` (eligible, not active, not seen, inside the 3-day window)
  - [x] 🟩 `POST {action:'bannerSeen'}` on each route → marks that kind seen

- [x] 🟩 **Step 3: Banners on Home**
  - [x] 🟩 `HyroxRewardBanner` gains an `onDismiss` ✕ (stopPropagation so it doesn't open the intro)
  - [x] 🟩 Overload "is open" card gains the same ✕
  - [x] 🟩 Each renders only when its `bannerDue`; tap → mark seen + open intro; ✕ → mark seen + hide
  - [x] 🟩 Remove the `hyrox_banner_seen_<id>` localStorage path and the always-on seen-banner branch

- [x] 🟩 **Step 4: More programs menu section (`components/AppMenu.tsx`)**
  - [x] 🟩 New section with Admin-style header "More programs", placed above Your performance; Hyrox Training then Overload Progressions; remove them from the main nav list
  - [x] 🟩 Props: per program `available` / `locked` + `lockedWeeks`; section renders only when Home passes them (Home's menu only)
  - [x] 🟩 Unlocked: normal item, no lock, opens the intro (existing `onTrack`)
  - [x] 🟩 Locked: disabled look + lock icon + "Unlocks after 6 locked weeks"; tap reveals "N of 6 weeks locked" inline
  - [x] 🟩 Hide the other program's item while one is active (existing rule)

- [x] 🟩 **Step 5: Wire Home (`app/home/page.tsx`)**
  - [x] 🟩 Pass locked/available/lockedWeeks for both programs into `AppMenu`
  - [x] 🟩 Keep `?hyrox=1` / `?overload=1` handling as-is

- [x] 🟩 **Step 6: Docs**
  - [x] 🟩 `app/help/page.tsx` Overload line: 6 locked weeks, More programs
  - [x] 🟩 `CLAUDE.md`: menu section, banner rule, DB seen kinds, Overload gate change
  - [x] 🟩 `docs/WHAT_IS_WORKIT.md` + `docs/plans/PLAN_OVERLOAD_PROGRESSIONS.md`: Overload unlocks at 6 locked weeks
  - [x] 🟩 `npm run lint` + `npm run build`; QA as **Test**
