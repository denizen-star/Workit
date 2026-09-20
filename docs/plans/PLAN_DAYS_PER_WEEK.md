# Feature Implementation Plan — Select Days Per Week (2–5)

**Overall Progress:** `100%`

## TLDR

Athletes choose their own weekly training frequency (2–5 days, default 4) instead of everyone following the fixed 4-required-day schedule. The choice is set at signup, changeable anytime in Edit profile, and re-prompted every 6 program weeks. Every place in the codebase that currently hardcodes "a complete week = 4 days" (belts, badges, week podium, Travel Survivor, nudge/recap emails) scales to the athlete's chosen count. Low-frequency (2–3 day) athletes get a new full-body day content pool so a short week isn't forced into an unbalanced upper/upper or lower/lower split.

Vote from the household (Kevin, Christine, Mike, Peter, Jared) came back positive on 2026-09-20 — this is greenlit.

## Critical Decisions

- **Range: 2–5 days**, default/recommended **4**. Selecting 5 makes the bonus day mandatory rather than optional.
- **Persistence: per-athlete, always editable.** New `users.schedule_days_per_week` column. Changeable anytime in Edit profile — not locked to a checkpoint.
- **Applies from week 1**, including the weeks 1–6 saddle — no fixed-4 exception period.
- **Entry points**: `/join` wizard gets a slider (default 4, marked recommended); Edit profile gets a persistent control; a **6-week re-ask** (program week boundaries — week 7, 13, 19, …) surfaces as a Home takeover (same family as `WeekMissTakeover`/`WeekPodiumTakeover`) plus an email nudge. Ignoring the re-ask keeps the current setting.
- **Reward systems scale with the athlete's count.** Every hardcoded `4` (week-lock, belts, weekly-completion badges, warmup/cooldown optional badges, Travel Survivor, week podium, nudge/recap emails) is read against that athlete's `schedule_days_per_week` instead of a fixed constant. This reuses the existing `weekLocked(week, sessions, requiredCount)` pattern already proven by Hyrox's `hyroxWeeksElapsed()`.
- **Rotation stays app-assigned.** `findNextProgramDay`/week-plan still assigns which days make up the athlete's week; the athlete can reorder/swap freely within that assigned set, but does not freely pick from the entire day catalog. No forced upper/lower balance constraint.
- **New full-body content**, authored from existing DB exercises, as a small rotating pool — offered **only to 2–3 day/week athletes**. 4–5 day athletes keep the current split-only structure.
- **Out of scope**: any interaction with the separate goal-programs/alt-exercises feature (`PLAN_GOAL_PROGRAMS_AND_ALT_EXERCISES.md`) — noted as a future reconciliation item only.

## Known Edge Case

Weeks 1–2 currently have exactly 4 `WorkoutDay` entries with **no 5th/bonus day at all** in the data (`lib/workoutData.ts`). An athlete who selects 5 days/week has no 5th day to require in those two weeks specifically. Needs explicit handling during implementation (e.g. treat weeks 1–2 as naturally capped at 4 for every athlete, regardless of a 5-day selection) — resolve when building Step 1.

## Tasks

- [x] 🟩 **Step 1: Schema + data model**
  - [x] 🟩 Add `users.schedule_days_per_week` (int, default 4, range 2–5) via a new `migrate-schedule-days.sql` (also added to `database/schema.sql` for fresh setups)
  - [x] 🟩 Add `users.schedule_days_asked_week` to track the 6-week re-ask checkpoint per athlete
  - [x] 🟩 Weeks 1–2 / 5-day edge case: handled automatically — `athleteRequiredDays` only adds the bonus day to "required" when `weekHasBonus(week)` is true, so a 5-day athlete naturally gets 4 in weeks 1–2 and 5 everywhere else
  - **Note:** `lib/auth.ts`'s `SessionUser`/`toSessionUser` now read `schedule_days_per_week`/`schedule_days_asked_week` through the existing graceful-fallback `userSelectMode` chain, so the app keeps working even before the migration is applied on PlanetScale — but `lib/badges.ts`, `lib/emails/nudge.ts`, and `lib/emails/lifecycle.ts` query the column directly (no fallback) and will need the migration applied before deploy, or those paths will throw/no-op until it is.

- [x] 🟩 **Step 2: Full-body content**
  - [x] 🟩 Authored a 3-pack rotating pool of full-body day variants from existing exercise names (`lib/scheduleDays.ts`, `FULL_BODY_PACKS`)
  - [x] 🟩 Wired into day-assignment (`athleteRequiredDays`/`athleteWeekDays`) so 2–3 day/week athletes get full-body days in place of the split; 4–5 day athletes are unaffected

- [x] 🟩 **Step 3: Day-assignment + week-lock logic**
  - [x] 🟩 New `lib/scheduleDays.ts` is the single source of truth: `athleteRequiredDays`, `athleteWeekDays`, `daysForWeekFn`, `requiredCountForWeek`, `resolveFullBodyDay`
  - [x] 🟩 `findNextProgramDay`/`defaultSelectWeek`/`getTodayTarget` (`lib/nextWorkout.ts`) take an optional `daysForWeek` resolver, defaulting to today's fixed behavior so Hyrox and any un-migrated caller are untouched
  - [x] 🟩 `weekLocked`/`weekProgress` (`lib/bonusDay.ts`) accept an athlete-aware required-days list
  - [x] 🟩 Wired end-to-end in `app/home/page.tsx` (Home's Today target + `WeekLock`) and `app/workout/page.tsx` (Select Workout's day list, week-progress label, `defaultSelectWeek`, belt-wash accent)
  - [x] 🟩 `app/api/sessions/route.ts`'s Gym/Travel mode PATCH resolves full-body days via `resolveFullBodyDay` (they aren't in the static `workoutProgram` array, so the existing `getWorkoutDay` lookup alone can't find them)

- [x] 🟩 **Step 4: Scale reward-system hardcoded 4s**
  - [x] 🟩 `lib/belts.ts` `lockedWeekCount` — now takes a `requiredCountForWeek` resolver; all 8 call sites updated (`app/api/belts`, `app/api/sessions` x2, `app/api/hyrox` x2, `app/home`, `app/workout` x3, `lib/hyroxEligibility`)
  - [x] 🟩 `app/api/sessions/route.ts` (both spots)
  - [x] 🟩 `lib/beltHousehold.ts` — rewritten to fold per-user raw session rows through `lockedWeekCount` with each user's own count (a flat SQL `HAVING` can't vary per row)
  - [x] 🟩 `lib/emails/lifecycle.ts` — recap's week/program-complete and `next` day now computed via the shared helpers instead of a flat `HAVING COUNT(*) >= 4`
  - [x] 🟩 `lib/emails/nudge.ts` — `getTodayTarget` now schedule-aware
  - [x] 🟩 `lib/badges.ts` — weekly-completion, warmup/cooldown optional-weeks, Travel Survivor, and perfect-weeks all scale to the athlete's count
  - [x] 🟩 `lib/weekPodium.ts` — `missedTheWeek` takes a `requiredCount` param; the Home miss-takeover route passes the athlete's current count (exact historical program week isn't tracked, so this uses their current setting rather than a per-week lookup — documented in the route)

- [x] 🟩 **Step 5: UI — `/join` wizard**
  - [x] 🟩 Day-count slider added to the form step (2–5, default/recommended 4); `POST /api/join` persists it on both the public-join insert and the invite-claim update path

- [x] 🟩 **Step 6: UI — Edit profile**
  - [x] 🟩 Day-count slider added to `EditProfileModal`, threaded through `AppMenu` and Home; `PATCH /api/me` persists it (both the full profile-save path and a lightweight standalone `scheduleDaysOnly` path for future use, mirroring the sound-only pattern)

- [x] 🟩 **Step 7: 6-week re-ask**
  - [x] 🟩 `components/ScheduleDaysAskTakeover.tsx` — Home takeover triggered at program week boundaries (7, 13, 19, …) via `isScheduleDaysAskWeek`; slider defaults to the athlete's current count, "Save & continue" persists both the new count and the asked-checkpoint in one `PATCH /api/me`
  - [x] 🟩 Matching `schedule_days_ask` email (`buildScheduleDaysAskEmail`) fires from the same daily nudge run (`lib/emails/nudge.ts`) so it reaches an athlete even on a day they don't open the app — deduped per (user, week boundary), registered in `lib/emails/ids.ts` and the admin mail preview page
  - [x] 🟩 No-op (keeps current setting) if ignored — the takeover only records the checkpoint when the athlete taps Save; the email path records it once sent

- [x] 🟩 **Step 8: Docs**
  - [x] 🟩 `CLAUDE.md` and `docs/WHAT_IS_WORKIT.md` updated to describe the day-count setting, full-body content, and the 6-week re-ask

## Post-ship QA fix: locked weeks must be permanent

**Found during QA** (reported by the user, confirmed via code trace + a scripted scenario check): belts, Hyrox's 6-locked-week eligibility gate, household belt rows, and badges' weekly-completion/streak/program-complete were all recomputing "is this week locked" **live** against the athlete's *current* `schedule_days_per_week`, with no memory of what the requirement was when a week was actually trained. An athlete going 3 → 2 → 4 days/week would have weeks completed at 3/week silently drop out of their locked-week count the moment they raised it back to 4 — a real regression of genuine past training, not just a display quirk.

**Fix — persisted `locked_weeks` table** (`database/migrate-locked-weeks.sql`, `lib/lockedWeeks.ts`):
- [x] 🟩 New table `locked_weeks(user_id, week_number, required_count, completed_count, locked_at)`, PK on (user_id, week_number) — a permanent, one-time fact, not a live computation.
- [x] 🟩 `recordWeekLockIfNeeded()` called from both session-completion paths in `app/api/sessions/route.ts` (POST-with-complete and PUT) the moment a week crosses its bar — idempotent (`INSERT ... ON DUPLICATE KEY UPDATE completed_count = GREATEST(...)`), so extra/Do Again sessions in an already-locked week keep `completed_count` accurate without ever touching `required_count` or un-locking anything. Gated to `program_track = 'main'` so Hyrox weeks (101+, their own 5-required rule) never pollute the count.
- [x] 🟩 **Backfill included in the same migration**: every week that already met the program's historical flat-4 rule (the only rule that ever existed before this feature shipped) locks permanently at `required_count = 4` — `INSERT IGNORE ... SELECT ... WHERE program_track = 'main' ... HAVING COUNT(*) >= 4`.
- [x] 🟩 Rewired every consumer to read the table instead of recomputing: `app/api/belts/route.ts`, `app/api/sessions/route.ts`, `app/api/hyrox/route.ts` + `lib/hyroxEligibility.ts` (signature simplified to take a `lockedWeeks: number` directly), `lib/beltHousehold.ts` (collapsed to a simple table read), `lib/badges.ts` (weekly-completion/streak/program-complete), `lib/emails/lifecycle.ts` (recap's week/program-complete), `lib/bonusDay.ts`'s `lockedWeekStreak` (now takes locked week numbers directly instead of a raw completed-day map), and both client pages (`app/home/page.tsx`, `app/workout/page.tsx`) via a new `lockedWeeks` field on `GET /api/sessions`.
- [x] 🟩 Removed the now-fully-dead `lockedWeekCount` live-recompute function from `lib/belts.ts`.
- [x] 🟩 **Verified** with a scripted scenario (`npx tsx` against the real `requiredCountForWeek` logic) walking exactly 3 → 2 → 4 days/week: 6 weeks lock at 3/week, stay locked after dropping to 2, a new week locks correctly at 2, and raising to 4 does **not** retroactively unlock the earlier weeks — each keeps the `required_count` that was actually active when it locked. Also verified extra/Do Again sessions in an already-locked week update `completed_count` without changing `required_count`.
- `npx tsc --noEmit` passes clean.
- **Not verified**: a real end-to-end run against a live/seeded PlanetScale database (no DB credentials available in this environment) — recommend running the migration + backfill against a dev/staging copy of prod data first and spot-checking a few athletes' locked-week counts before/after to confirm the backfill numbers look right.

## Post-ship bug: full-body days couldn't actually be started

**Found via user report** ("changed days, can't start today's workout for Test") and confirmed live: `startWorkout()`, `getCurrentWorkout()` (`app/workout/page.tsx`), and `getTodayTarget()`'s resume branch (`lib/nextWorkout.ts`) all looked up the day definition via a plain `week.days.find(...)` against the static `workoutProgram` array — which never contains full-body days (dayNumber 6+, synthesized per-athlete). For a 2-3 day athlete this meant: Select Workout correctly *rendered* the Full Body day cards, but clicking Start silently no-op'd (`if (!day) return;`), and even a session created another way would have rendered a blank live page (`if (!workout) return null;`). Home's "resume an open full-body session" detection had the same gap.

- [x] 🟩 Fixed all three call sites with the same `resolveFullBodyDay` fallback already used in the PATCH exercise-modes endpoint.
- [x] 🟩 Swept the whole codebase for every other `.days.find(...)` / `getWorkoutDay(...)` call site — the two in `lib/bonusDay.ts` (`sessionIsBonus`, `isUpperSession`) fail safe (return false for an unrecognized day, which is correct for full-body days) and needed no change.
- [x] 🟩 **Verified live**: logged in as Test via a scripted browser session, set `schedule_days_per_week=2` through the real API, confirmed the Full Body A/B cards render in Select Workout, clicked Start, and confirmed the live session opens with real exercises, images, and the coach bubble — no blank page, no console errors.

## Post-ship bug found during `/document` pass: Completed log ignored the setting entirely

While verifying CLAUDE.md/`docs/PAGE_SECTIONS.md` against actual code for the `/document` task, found `components/CompletedLog.tsx` (`/history`) still called `weekProgress(sessions, week)` with no `required`/`lockedRecord` args — silently defaulting to the flat historical 4, unaware of `schedule_days_per_week` or the persisted `locked_weeks` table entirely. A 2-3 day athlete's genuinely-locked week would never show its checkmark there; a 5-day athlete's bonus day wouldn't count.

- [x] 🟩 `GET /api/sessions?history=1` now also returns `scheduleDays` and `lockedWeeksDetail` (via `lockedWeekRecords`), matching what the non-history branch already gave Home/Select Workout.
- [x] 🟩 `CompletedLog.tsx` now passes `athleteRequiredDays(week, scheduleDays)` and the matching `lockedWeeksDetail` entry into `weekProgress`, same pattern as `WeekLock`/Select Workout.
- `npx tsc --noEmit` clean. Not re-verified live in browser (caught by static/manual trace, not a repro click-through) — worth a quick glance at `/history` next time you're in there.

## Post-ship polish (all four, done in sequence)

- [x] 🟩 `/help` — Program & Belts section now mentions the day-count setting and that a locked week stays locked.
- [x] 🟩 `docs/WHAT_IS_WORKIT.md` — added the same "already locked stays locked" reassurance line.
- [x] 🟩 `WeekLock` — the separate "Bonus 0/1" line now hides itself when the bonus day is already folded into `required` (5-day athletes), since it was redundant with the tile already shown above.
- [x] 🟩 `schedule_days_ask` email — verified it renders correctly (subject, text, HTML, CTA link all present) by calling `sampleEmail('schedule_days_ask')` directly; no admin login needed for this check.

## Deployment note

**Apply `database/migrate-schedule-days.sql` and `database/migrate-locked-weeks.sql` on PlanetScale before deploying this code** (the second migration's backfill doesn't depend on the first, but both are needed before the app code that reads them ships). Unlike some other optional columns in this codebase, `schedule_days_per_week`/`schedule_days_asked_week` are queried directly (no graceful fallback) in `lib/badges.ts`, `lib/emails/nudge.ts`, and `lib/emails/lifecycle.ts` — if the column doesn't exist yet, those queries throw. Badge-checking and the nudge/recap email queries all wrap in try/catch, so nothing crashes user-facing, but badges would silently stop being awarded and nudge/recap emails would silently stop sending until the migration is applied. `lib/auth.ts`'s `SessionUser` read (`app/api/me`, most of the UI) is safe either way via the existing `userSelectMode` fallback chain. Belts (`app/api/belts`), Hyrox eligibility, and badges' weekly-completion/streak/program-complete all query `locked_weeks` directly with no fallback either — same caveat, same file.

## Verification performed

- `npx tsc --noEmit` passes clean after every chunk of this implementation.
- Not manually tested in the browser (`npm run dev` + a live click-through) — recommend running through: `/join` signup with a non-default day count, Edit profile day-count change, a 2-3 day athlete's Select Workout showing full-body days, and the week-7 Home re-ask takeover, before shipping.
