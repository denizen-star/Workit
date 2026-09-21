# Feature Spec — Goal-Based 6-Week Programs + Alt Exercises

**Overall Progress:** `0%` — scoping only, not yet greenlit. Sent to the household (Kevin, Christine, Mike, Peter, Jared) for a vote on 2026-09-20; no decision yet.

## Origin

Athlete feedback from Christine Widga (via Kevin), two separate asks:

1. Multiple 6-week programs to suit different goals.
2. Alt exercises when the gym doesn't have the needed machine, or she doesn't like an exercise — the alt should still hit the same muscle group.

A third, related piece of feedback ("choose your days per week, min 2") was deliberately split out — see `PLAN_DAYS_PER_WEEK.md`.

## TLDR

Two distinct features bundled in one round of feedback, very different in size. Alt exercises is a contained UI + content addition, similar in shape to the existing Gym/Travel toggle. Goal-based programs is a much bigger commitment — architecturally closest to a second and third Hyrox-style opt-in track, not a tweak to the existing 6-week saddle.

## What the ask is understood to be

**Goal programs**: an athlete should be able to opt into a goal-specific 6-week block (e.g. Strength, Hypertrophy) at any time, the same way Hyrox training works today — it pauses their normal program, runs its own content for 6 weeks, then hands them back to the normal program where they paused, which continues into the existing shared week 7+. Not a one-time onboarding pick, not a permanent fork of the 48-week spine.

**Alt exercises**: a per-exercise swap, coarse muscle-group tagged (chest/back/legs/shoulders/arms/core/full-body), one curated default alternate per exercise (not an open picker) — mechanically the same toggle pattern as Gym/Travel, sitting in the same pill row on the exercise card, locking after the first completed set. A swap is a per-session convenience, not a persisted preference. History/PRs on the swapped-in exercise track separately from the original (no merge), to avoid the mismatch bug already flagged in `lib/exerciseKey.ts`.

## Codebase findings

**Alt exercises**
- No muscle-group metadata exists anywhere today. `Exercise` (`lib/workoutData.ts:8-25`) has no muscle/category field; `exercises` table, `lib/exerciseMedia.ts`, `lib/exerciseImages.ts` are all keyed by exercise-name string only.
- The existing travel-mode substitution (`lib/travelExercises.ts:9-167`, `BY_GYM_NAME`) is a fixed 1:1 hand-authored map — good precedent for "one curated alt per exercise," not for an open muscle-group pool.
- `applyExerciseMode()` / `applyWorkoutMode()` (`lib/workoutData.ts:454-462`) are invoked live in `components/ExerciseTracker.tsx`, `app/workout/page.tsx`, `app/home/page.tsx`, `app/api/sessions/route.ts:358`. Mode is switchable on a card until the first completed set, then locks — same lock rule an Alt toggle should follow.
- History/PR continuity across a swap is handled today via `lib/exerciseKey.ts`'s `exerciseHistoryKey()` name-equivalence groups (`GROUPS`, lines 10-105), not the raw DB exercise name. The file has a documented, unresolved gap (`exerciseKey.ts:3-9`) where two travel substitutes land in the wrong history bucket — decided precedent for this feature: **do not merge history on swap**, track the alt as its own exercise from the start.
- `POST /api/exercises`'s `exercise_name = COALESCE(?, exercise_name)` (`app/api/exercises/route.ts:101-107`) is exactly the travel-substitution rename mechanism (renames an uncompleted set row when mode flips mid-session) — the same plumbing an Alt toggle would reuse.

**Goal programs**
- No existing "goal" or program-variant concept anywhere (grepped goal/track/variant/program_track — only hits are Hyrox's own `program_track` and the unrelated optionals "track" picker).
- Hyrox (`lib/hyroxProgram.ts`, `hyrox_state` table, `workout_sessions.program_track`) is the only precedent for "more than one program," and it's additive/opt-in, not a replacement: normal-program position is snapshotted (`normal_week_at_start`/`normal_day_at_start`) on entry and restored (`resumeWeek = normal_week_at_start + hyroxWeeksElapsed`) on drop/exit, computed in `app/api/hyrox/route.ts`.
- Reused by Hyrox without modification: `WeekLock` / `WeekPerformance` (already take a generic `WeekPlan` + `sessions` shape). Reused with a small param addition: `weekLocked()` gained an optional `requiredCount` (`lib/bonusDay.ts`) so Hyrox's 5-day weeks could lock differently from the normal 4-day rule — the same mechanism a goal track would reuse if it ever needed a different required-day count.
- Rebuilt per-track by Hyrox: its own Home replacement (`HyroxHome`), its own eligibility gate (`lib/hyroxEligibility.ts`, requires 6 locked normal-program weeks), its own state table, its own program data file, its own code-bank-only coach lines (not the DB-backed `coach_lines` catalog).
- Week-number namespacing (`HYROX_WEEK_OFFSET = 100`, weeks 101+) exists purely to avoid `week_number` collisions in shared columns (`workout_sessions`, `daily_stats`, `week_podium`) — a second/third track would need its own offset band.

## Scope decisions made during scoping conversation

- **One alt-track at a time**: an athlete can be in the normal program, Hyrox, Strength, or Hypertrophy — never two of the opt-in tracks simultaneously. Matches Hyrox's existing assumption.
- **Rewards**: goal tracks reuse the existing belt/badge system. No separate diploma track (unlike Hyrox's `hyrox_diplomas`).
- **Eligibility**: gated like Hyrox — requires 6 locked weeks in the normal program before a goal track unlocks. Not open to brand-new athletes.
- **Content**: goals imply different exercise selection, not just different set/rep schemes on the same movements — this is real new content authorship, not a data-only change. Kevin will draft example 6-week content per goal for review, same division of labor as Hyrox's hand-written `lib/hyroxProgram.ts`.
- **Tagging granularity**: coarse muscle groups (~6-8: chest, back, legs, shoulders, arms, core, full-body/cardio).
- **Swap UI**: extends the existing Gym/Travel pill row rather than a separate control; stays a toggle (not a picker), since the tag is used to validate/curate the single alternate, not to expose an open list.

## Pros / cons / cognitive load (sent to athletes 2026-09-20)

**Alt exercises** — Pros: real everyday friction fix; doesn't touch week/badge/belt logic; reuses a familiar toggle. Cons: 150+ exercises need tagging + a hand-picked alt; swapped exercise loses PR continuity by design. Cognitive load: low-to-medium.

**Goal programs** — Pros: real personalization; Hyrox already proves the pattern end to end. Cons: effectively 1-2 more Hyrox-sized programs (content, coach lines, eligibility, branching logic); standing maintenance cost on every future program-wide change, indefinitely. Cognitive load: meaningfully higher on both the athlete side (4 things to be "in") and the build side.

## Open / not yet decided

- Interaction between Alt toggle and Gym/Travel toggle on the same card (can both apply at once?) — implementation detail, not yet resolved.
- Which goal(s) ship first, and the actual 6-week content — pending Kevin's draft.
- Whether to build this at all — pending athlete vote (email sent 2026-09-20 to Kevin, Christine, Mike, Peter, Jared; asked to reply with a pick or a 1-2-3 ranking across all three requests, this doc's two plus `PLAN_DAYS_PER_WEEK.md`'s one).

## Tasks

- [ ] 🟨 **Not started** — blocked on athlete vote. No implementation steps defined yet.
