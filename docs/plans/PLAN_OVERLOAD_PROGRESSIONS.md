# Feature Implementation Plan — Overload Progressions

**Overall Progress:** `100%` — built, migrations applied 2026-09-27, API pass as Test green ([pick page](https://claude.ai/artifact/43DHmWpS3zujJB9S2CTS9k)). Gate changed after build: opens once main week 6 is locked, with a Home card. Cable Chest Fly media, How, Alt, travel swap (Backpack Floor Flyes), Dumbbell Flyes alt and Library done.

## TLDR

**Overload Progressions** is a 6-week hypertrophy series that athletes opt into. It works like Hyrox Training: it pauses the main program, runs its own weeks, then hands the athlete back further along the year. The content is our own, written from general hypertrophy principles, which Jeff Nippard's *The Muscle Ladder* also uses. The app never uses the book's name or copies its programs.

Each series:

- follows the athlete's 1–5 days-per-week setting;
- uses rests from 75 s to 3 min depending on the lift;
- climbs a set target effort each week;
- awards its own diploma tiers.

Two things ship in **both** tracks:

- a **next-load suggestion** above the last-time chip, based on double progression;
- an **"Aim: …" effort line** on every lift card.

The Muscle Ladder book supersedes the goal-programs half of `PLAN_GOAL_PROGRAMS_AND_ALT_EXERCISES.md`.

## Critical Decisions

**Name and content**
- **Name: "Overload Progressions"**: never "Muscle Ladder", which is Nippard's title.
- **Content: 20 day templates proposed by Claude**: two for each of the 10 days in the split. Kevin ticks one per day on a shareable page, and only the picked 10 ship.

**How the track runs**
- **Hyrox-style opt-in track, one at a time**: an athlete can be in Overload Progressions or Hyrox, never both, but both can happen in a year.
  - Joining needs 6 locked **main-program** weeks.
  - It starts on a Monday; until then the athlete keeps training the main program.
  - There is no deload week.
  - It can be repeated, and leaving partway restarts it at week 1.
- **Week band 201+ (`OP_WEEK_OFFSET = 200`)**: the same namespacing as Hyrox's 101+.
  - Today the track is derived with a two-way `week > 100 ? 'hyrox' : 'main'` check (`app/api/sessions/route.ts:91`, `:462`).
  - That becomes a band lookup that returns `'main' | 'hyrox' | 'overload'`.
- **Leaving jumps the main program ahead by the weeks actually spent**, using the same `resumeWeek` formula as Hyrox.
- **Your pick is hidden** while the track is active.

**Days and weekly progression**
- **Split follows `schedule_days_per_week`, capped at 5**:
  - 1–3 days: Full Body A / B / C
  - 4 days: Upper A / Lower A / Upper B / Lower B
  - 5 days: Upper / Lower / Push / Pull / Legs
  - A change midway carries on with the new split. The required count per week is the athlete's count.
- **Weekly progression is computed by a function, not written out six times**:
  - Weeks 1–2: Fair, compounds 2 sets.
  - Weeks 3–4: Hard, 3 sets.
  - Weeks 5–6: Hard to Max, with the last isolation set to failure.

**Rest**
- **Per-exercise rest**: a new optional field `Exercise.restSeconds`.
  - Heavy compounds 180 s, secondary compounds 120 s, isolation 75 s.
  - The athlete's extra rest minutes are **ignored** when `restSeconds` is set.
  - The main program keeps 60 s plus extra minutes.

**Next-load suggestion (both tracks)**
- **Rule: double progression, suggest only.** Prefill is unchanged, and the suggestion sits above the last-time chip.
  - If every planned set reached the top of the rep range at average effort Hard or below: add weight.
  - Otherwise: same weight, aim for +1 rep.
  - If the sets were at Max and missed the bottom of the range: drop 5–10%.
- **Rep targets**: a single-number target (e.g. "10") counts as the top of the range. Timed and bodyweight lifts get no suggestion.
- **Steps**: dumbbell isolation +2.5 lb, other upper-body lifts +5 lb, Legs lifts +10 lb (legs identified by the existing `lib/movementPattern.ts` tag).
- **kg users** see the step in kg, rounded to +1, +2.5 or +5.

**Target effort line (both tracks)**
- "Aim: Hard · about 2 reps left".
- Overload Progressions uses each week's target; the main program defaults to Hard.

**Rewards**
- **Belts**: Overload Progressions locked weeks go into `locked_weeks` and count toward belts, including the belt the athlete is aiming for.
- **Gates**: the 6-week gates for Hyrox and Overload Progressions count **main-program weeks only (1–48)**.
- **Board**: sessions count on badges, the house board and the weekly podium, like the main program.
- **Own diploma, 3 tiers**: awarded when calendar weeks 2, 4 and 6 end while the athlete is still in the track, however many workouts were done. It's computed when the athlete opens the app, like the week podium, and kept in a table separate from belts, like `hyrox_diplomas`.

**Look and voice**
- **Look**: the existing Hyrox red wash (`.hyrox-session`) plus its own Home screen, like `HyroxHome`.
- **Coach lines**: in the **database catalog** (`coach_lines`, all 4 voices), not the code bank Hyrox uses. The fallback copy stays in `lib/coachLines.ts`.

## Tasks

- [x] 🟩 **Step 1: Day-template proposal and pick page**
  - [x] 🟩 Draft 20 day templates, 2 for each day (Full Body A/B/C, Upper A/B, Lower A/B, Push, Pull, Legs).
    - Each lists its slots in order, with exercise, sets, rep range, rest and role (heavy compound / secondary / isolation).
    - They reuse existing exercise names wherever possible so history, PRs and media carry over.
  - [x] 🟩 Publish a shareable artifact page where Kevin ticks one template per day, with the picks saved to the page's shared database.
  - [x] 🟩 Wait for Kevin's picks. Steps 3+ use only the picked 10. Picked: Full Body A=B, B=A, C=B · Upper A=B · Lower A=A · Upper B=B (adds new Cable Chest Fly) · Lower B=A · Push=A · Pull=B · Legs=A.

- [x] 🟩 **Step 2: Schema** (`database/migrate-overload.sql`, applied with `scripts/apply-migration.ts`)
  - [x] 🟩 `overload_state` (one row per user: `active`, `started_at`, `normal_week_at_start`, `normal_day_at_start`), mirroring `hyrox_state`.
  - [x] 🟩 `overload_diplomas` (user, run start, tier 1–3, `awarded_at`; unique on user + run + tier).
  - [x] 🟩 `program_track` accepts `'overload'`.
  - [x] 🟩 Coach-line rows for the new events, all 4 voices: `overload_start`, `overload_diploma` (`migrate-overload-coach-lines.sql`, generated from the code bank).

- [x] 🟩 **Step 3: Program data** (`lib/overloadProgram.ts`)
  - [x] 🟩 `OP_WEEK_OFFSET = 200`, `overloadDisplayWeek()`, and the 10 picked day templates.
  - [x] 🟩 `overloadWeek(week, daysPerWeek)`: picks the split for the day count and applies that week's sets and effort target.
  - [x] 🟩 `getOverloadWorkoutDay()` and a branch in `resolveSessionDay()` (`lib/resolveDay.ts`).
  - [x] 🟩 `Exercise.restSeconds` and `Exercise.targetEffort` (optional) added in `lib/workoutData.ts`.

- [x] 🟩 **Step 4: Session and track plumbing**
  - [x] 🟩 Replace the two-way track checks in `app/api/sessions/route.ts` with a shared `trackForWeek()` helper (main / hyrox / overload).
  - [x] 🟩 Allow week 201+ starts only while `overload_state.active` is on and the start Monday has passed.
  - [x] 🟩 Record Overload Progressions week locks in `locked_weeks`. Required count = the athlete's days that week.
  - [x] 🟩 Belts count every locked week. `lib/hyroxEligibility.ts` and the new Overload Progressions gate count only weeks 1–48.
  - [x] 🟩 Scoreboard, week podium and badges include overload sessions. Check that no query filters to `program_track = 'main'` where it shouldn't.

- [x] 🟩 **Step 5: State API** (`app/api/overload/route.ts`, modelled on `app/api/hyrox/route.ts`)
  - [x] 🟩 `start`: gate check, block if Hyrox is active, save the main-program position, idempotent if already active.
  - [x] 🟩 `drop`: `resumeWeek = normal_week_at_start + weeks elapsed`, then clear the active flag.
  - [x] 🟩 GET: state, next day, and the computed diploma tiers (award tiers 1–3 once calendar weeks 2, 4 and 6 have ended).
  - [x] 🟩 A restart begins at week 1: each run gets its own week band (201-206, 211-216, …), so "what's next" is scoped by week range, not `started_at`.
  - [x] 🟩 Block Hyrox `start` while Overload Progressions is active.

- [x] 🟩 **Step 6: Entry, Home and leaving**
  - [x] 🟩 `AppMenu` item "Overload Progressions" once eligible.
  - [x] 🟩 Intro takeover: what it is, starts Monday, what a week looks like, the diplomas. Uses the `overload_start` line.
  - [x] 🟩 `OverloadHome`: modelled on `HyroxHome`, reusing `WeekLock`, `WeekPerformance`, `HomeTodayKpis` with a track param, and a diploma strip.
  - [x] 🟩 Diploma takeover on the first Home open after a tier is earned.
  - [x] 🟩 "Leave Overload Progressions" in the menu footer, with a confirmation that says it restarts at week 1.
  - [x] 🟩 Hide Your pick while active.

- [x] 🟩 **Step 7: Live workout**
  - [x] 🟩 `/workout` loads Overload Progressions weeks (Select Workout plus the live session) the way Hyrox mode does, with the Hyrox red wash.
  - [x] 🟩 `ExerciseTracker` rest: use `exercise.restSeconds` when set and skip extra minutes; otherwise keep today's behaviour.
  - [x] 🟩 `lib/estimateDuration.ts`: use `restSeconds` in the time estimate.

- [x] 🟩 **Step 8: Next-load suggestion and Aim line (both tracks)**
  - [x] 🟩 `lib/nextLoad.ts`:
    - parse the rep range (a single number = top of the range);
    - apply the double-progression rule and the steps (+2.5 / +5 / +10);
    - skip timed and bodyweight lifts;
    - convert to kg when needed.
  - [x] 🟩 Show the suggestion above the last-time chip in `components/ExerciseTracker.tsx`, styled so it stands out.
  - [x] 🟩 Aim line: `targetEffort` → "Aim: Hard · about 2 reps left". Default Hard in the main program.
  - [x] 🟩 Hide both once `exerciseFullyDone`, like the other setup controls.

- [x] 🟩 **Step 9: Coach catalog**
  - [x] 🟩 Add the new event lines for all 4 voices to `lib/coachLines.ts` (`pickOverloadLine`), DB buckets in `lib/coachCatalog.ts` + `scripts/apply-coach-catalog.ts`, rows in `migrate-overload-coach-lines.sql`. Not yet applied to PlanetScale.

- [x] 🟩 **Step 10: Docs**
  - [x] 🟩 `CLAUDE.md`: an Overload Progressions section plus the next-load and Aim notes.
  - [x] 🟩 `docs/WHAT_IS_WORKIT.md`: track rules and belt counting.
  - [x] 🟩 `app/help/page.tsx`: short Overload Progressions entry and the glossary terms "Next load" and "Aim".
  - [x] 🟩 Mark the goal-programs part of `PLAN_GOAL_PROGRAMS_AND_ALT_EXERCISES.md` as superseded.

- [x] 🟩 **Step 11: Verify as Test**
  - [x] 🟩 `npm run build` passes; lint adds no new errors (18 existing errors in touched files are unchanged, new files are clean).
  - [x] 🟩 API pass as **Test** (PIN 0000) against `npm run dev` + prod DB: eligible (week 6 locked) → start (Monday 2026-09-28, idempotent) → Hyrox start 409 → pre-Monday session refused → (starts_on moved to today) running, today = Week 1 Upper A → session tagged `overload` on week 201 → other-run week refused → leave → resume week 7. Test's session, run and diplomas rows removed afterwards. Visual click-through of the new screens still to do:
    - join, wait for Monday, run a session;
    - check rest lengths, the Aim line and the next-load suggestion in both tracks;
    - leave, and check the main program's jump-ahead;
    - check the diploma takeover.
