# Hyrox Training Track — Implementation Plan

**Overall Progress:** `100%`

## TLDR
Add "Hyrox Training" as an optional 16-week training track athletes can pick up once they've locked 6 weeks of the normal 48-week program. While active it fully replaces their Home/program view (Monday-start, 4 training days/week), runs its own separate diploma track, self-reported pass/fail milestones every few weeks, and an inverted-color live-session wash — then hands them back to the normal 48-week program at `startWeek + hyroxWeeksCompleted`. This build ships the full mechanism plus Phase 1 content (weeks 1–4 + Milestone 1); Phases 2–4 are a later content-only pass.

## Critical Decisions
- **Eligibility gate**: 6 *locked* weeks (existing `weekLocked` logic), not calendar time — reuses `lib/bonusDay.ts`/week-lock machinery instead of new date math.
- **Program relationship**: Hyrox *replaces* Home while active (own Mon-start week/day counter); on exit (finish, or drop after fail) the athlete's normal-program position becomes `positionWhenStarted + hyroxWeeksElapsed` — computed dynamically at exit time, not a flat +16.
- **Data model**: new minimal tables for Hyrox state/milestones/diplomas rather than overloading `workout_sessions`/`badges`, since the requirement/gating model (pass/fail, phase-gated, separate track) doesn't fit the existing generic-badge or belt schema.
- **Sessions**: Hyrox workouts still write to `workout_sessions`/`exercise_sets` (tagged with a track marker) so they flow into existing scoreboard/volume/badge aggregation for free — no parallel stats pipeline.
- **Milestones**: self-reported pass/fail via a coach-voiced checklist takeover (criteria are subjective — joint pain, unbroken sets — not derivable from logged data). Hard gate on phase advancement only; athlete can always drop to the normal program, choosing Retry vs Drop on a fail.
- **Diplomas**: separate Hyrox-only diploma track/UI, independent of the existing belt chest.
- **Color wash**: literal CSS `filter: invert(...)` on the live session, applied instead of (not blended with) belt wash.
- **New exercises**: sourced via hand-picked YouTube video id + thumbnail-frame still for each (same `youtubeFrame()` pattern as Yoga), added to the catalog now, not deferred.
- **Coach voice**: intro takeover and milestone pass/fail moments use the athlete's existing coach persona (new `coach_lines` buckets), consistent with every other takeover.

## Tasks:

- [x] 🟩 **Step 1: Database schema**
  - [x] 🟩 `migrate-hyrox.sql`: `hyrox_state` (user_id, active, hyrox_week, normal_week_at_start, normal_day_at_start, started_at, ended_at) — one row per user
  - [x] 🟩 `hyrox_milestones` table (user_id, milestone_number, result pass/fail, decided_at) — supports retries
  - [x] 🟩 `hyrox_diplomas` table (user_id, tier, earned_at) — separate from `user_badges`
  - [x] 🟩 `program_track` marker added to `workout_sessions` (`VARCHAR(16) DEFAULT 'main'`, value `'hyrox'`)
  - [x] 🟩 Coach lines: **deviation from original plan** — implemented as code-bank-only additions to `lib/coachLines.ts` (`hyroxIntro`/`hyroxMilestonePass`/`hyroxMilestoneFail` per voice), same precedent as the existing `sessionStart` moment. No `coach_lines` DB migration — avoids extending `lib/coachCatalog.ts`'s external type for a one-time/non-editable moment, lower risk, matches an established in-repo pattern.

- [x] 🟩 **Step 2: Phase 1 program content**
  - [x] 🟩 `lib/hyroxProgram.ts`: weeks 1–4 authored as `WeekPlan`/`WorkoutDay[]`, Day1=Mon/Day2=Tue/Day3=Wed(rest)/Day4=Thu/Day5=Fri(rest)/Day6=Sat/Day7=Sun(rest), compressed to dayNumber 1-4 (Mon/Tue/Thu/Sat) same as normal program's day-numbering convention
  - [x] 🟩 Week 4 Day 3 (Thu slot) flagged `milestone: 1` — the Milestone 1 benchmark day
  - [x] 🟩 Sled Push substitute baked into exercise notes (Floor Plate Push primary, OFF-Treadmill Drive noted alternative) — no new setting
  - [x] 🟩 New exercise catalog entries (Floor Plate Push, SkiErg, Wall Balls, Burpees/Burpee Broad Jumps, Leg Press, Seated Cable Row, etc.) added to `lib/exerciseMedia.ts` with real YouTube video ids (sourced via web search) — thumbnails auto-derive via `youtubeThumbUrl()`, no `exerciseImages.ts` (free-exercise-db) entries needed since that map isn't in the video-tab path

- [x] 🟩 **Step 3: Eligibility + entry points**
  - [x] 🟩 `lib/hyroxEligibility.ts`: `hyroxEligible()` off `lockedWeekCount` (≥6)
  - [x] 🟩 "Hyrox Training" item in `AppMenu` (new `hyroxAvailable` prop), shown once eligible
  - [x] 🟩 Home nudge — **deviation**: implemented as a persistent "Try Hyrox Training" card (always visible once eligible, doubling as the destination content) plus a one-time highlighted banner variant on first eligibility, gated via `localStorage` rather than a new DB table (lighter-weight than `week_takeover_seen`; acceptable since missing this nudge once on a cleared browser has no real consequence)

- [x] 🟩 **Step 4: Intro takeover**
  - [x] 🟩 `HyroxIntroTakeover` component: coach-voiced (`pickHyroxIntroCopy`), 3 sections, Start/Not now
  - [x] 🟩 `POST /api/hyrox {action:'start'}`: server-side eligibility re-check, snapshots normal position via `findNextProgramDay` into `hyrox_state`

- [x] 🟩 **Step 5: Hyrox Home + live session**
  - [x] 🟩 `app/home/page.tsx` early-returns a dedicated `HyroxHome` component whenever `hyrox_state.active` (not threaded through the normal 480-line Home render — its folds don't apply to Hyrox anyway)
  - [x] 🟩 `app/workout/page.tsx` fetches `/api/hyrox` on mount; while active, Select Workout + live session both read `lib/hyroxProgram.ts` (`program` local var) and new sessions write `program_track='hyrox'` (`POST /api/sessions` updated to accept/store it)
  - [x] 🟩 Live session applies `.hyrox-session` (literal `filter: invert(1)`, `globals.css`) instead of `beltWashStyle`
  - [x] 🟩 Coach bubble / PR / gain-loss / effort moments untouched — same `ExerciseTracker`/`CoachBubble` wiring, reused as-is
  - [x] 🟩 Week completion/lock reuses `weekLocked`/`findNextProgramDay` unmodified (both already took a `program` param)
  - [x] 🟩 **Added, not in original plan**: Hyrox week numbers namespaced to 101+ (`HYROX_WEEK_OFFSET`/`hyroxDisplayWeek()`) after realizing weeks 1-4 would otherwise collide with the normal program's weeks 1-4 in `week_number`-keyed queries; display spots convert back for "Week N" text

- [x] 🟩 **Step 6: Milestone flow**
  - [x] 🟩 `HyroxMilestoneTakeover` (checklist → self-report Pass/Not yet, coach-voiced result line via `pickHyroxMilestoneLine`)
  - [x] 🟩 Pass: `POST /api/hyrox {action:'milestone'}` inserts `hyrox_milestones` + `hyrox_diplomas` tier
  - [x] 🟩 Fail: Retry (no server action needed — client just re-attempts the same day) or Drop (calls `action:'drop'`)

- [x] 🟩 **Step 7: Exit flow (finish or drop)**
  - [x] 🟩 `resumeNormalWeek()` (`lib/hyroxState.ts`) computes `normal_week_at_start + hyroxWeeksElapsed`; `POST /api/hyrox {action:'drop'}` overwrites `normal_week_at_start` with it and clears `active`
  - [x] 🟩 `findNextProgramDay`/`defaultSelectWeek`/`getTodayTarget` (`lib/nextWorkout.ts`) gained an optional `minWeek` param (default 1, additive) so the normal program resumes at that floor instead of wherever completed sessions alone would put it
  - [x] 🟩 Same drop path handles both a failed-milestone "leave" choice and an unprompted abandon (Home's "Leave Hyrox Training" link)

- [x] 🟩 **Step 8: Diploma track UI**
  - [x] 🟩 `HyroxDiplomas` component (4-tile grid, only tier 1 currently earnable), shown on `HyroxHome`

- [x] 🟩 **Step 9: Scoreboard/badge verification**
  - [x] 🟩 Checked `lib/badges.ts` — all queries scope by `user_id` only, no `program_track` filtering, so Hyrox sessions already flow into badges/volume for free. No changes needed.

- [x] 🟩 **Step 10: Docs**
  - [x] 🟩 Added a Hyrox Training paragraph to `CLAUDE.md`
  - [x] 🟩 `docs/WHAT_IS_WORKIT.md` **not** updated — Hyrox Training isn't part of the core 48-week program rules that doc describes; left for a future pass once Phase 2-4 content ships

## Known limitations / follow-ups
- Only Phase 1 (weeks 1-4) + Milestone 1 have real content; weeks 5-16 and Milestones 2-4 need a future content-only pass (`lib/hyroxProgram.ts`, `lib/hyroxProgram.ts`'s `HYROX_MILESTONE_CRITERIA`).
- YouTube video ids for new exercises were sourced via live web search for real, currently-published videos — but weren't watched end-to-end, so verify each one still resolves before relying on it in production.

## Revision (post-testing feedback)
Migration was applied to PlanetScale and Test was seeded with 6 fake-complete weeks for manual QA (`scripts/apply-hyrox-migration.ts`, `scripts/seed-test-six-weeks.ts` — one-off, safe to delete once no longer needed). Feedback from that pass:
- **Renamed** "Hyrox Prep" → "Hyrox Training" everywhere.
- **Intro takeover rewritten** to fixed copy (title, summary, 3 numbered items) instead of coach-line-generated text; removed the now-unused `hyroxIntro` coach-bank entries and `pickHyroxIntroCopy`.
- **Banner copy** replaced per feedback; "6 Week Program" in the supplied text was changed to "16-week program" since it contradicted the 16-week/4-milestone track described everywhere else — flagged to the user, not silently assumed.
- **Day labeling** added ("Day N" badge) to Select Workout day cards and the live session header.
- **Duration estimates fixed**: added `Exercise.estimatedMinutes` as an explicit override in `lib/estimateDuration.ts` for content the sets×reps model can't parse (continuous runs, AMRAPs, circuits) — additive, zero effect on the normal program's existing entries.
- **Week structure corrected**: the supplied plan is 5 training days + 2 rest days (Day 3 "Active Recovery" is a real day, not pure rest), not 4+3 as first built. Added `activeRecovery()` day to all 4 Hyrox weeks (dayNumber 1-5 now; milestone moved from Day 3 to Day 4). This required `lib/bonusDay.ts`'s `weekLocked()` to accept a per-week `requiredCount` (default unchanged at 4) so `findNextProgramDay` can pass `requiredDays(week).length` — Hyrox weeks now correctly need all 5 days, not 4, to advance. `lib/hyroxState.ts`'s `hyroxWeeksElapsed()` also rewritten off the same per-week count instead of `lib/belts.ts`'s hardcoded-4 `lockedWeekCount`.
- **Color scheme**: built `public/hyrox-session-preview.html` with 3 options (Hyrox Red / Steel / Dusk); user picked **Hyrox Red** (black/charcoal ground, competition-red header + card accents). Wired into `.hyrox-session` in `globals.css`, replacing the placeholder `filter: invert(1)`. Only backgrounds/borders are tinted (same restraint as the belt wash) — gold CTA buttons and cream body text are untouched, per the app's global gold-means-action convention.
- **"Why did Home change?"** — explained to the user as the deliberate outcome of their own earlier "replaces the main program" decision; open question back to them on whether that should be reconsidered now that they've seen it (not yet resolved).
