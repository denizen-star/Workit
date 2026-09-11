# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR
Three small, independent fixes surfaced during exploration:
1. The live "Exercise Volume" KPI tile shows a same-session sum; swap it to show the volume from the last time that exercise was actually completed, since that's the number that's useful mid-lift.
2. The Target / Gym-Travel / Lb-Kg / thumbs row on each live exercise card wraps to two lines; make it fit on one line at every screen width, phone included.
3. The week-podium ("Last week · 2nd") and week-miss takeover screens re-show every login because "have you seen this" is tracked only in browser `localStorage` — it needs to move server-side so it's tied to the account, not the device.

No new features (per-week workout count table, extra-set removal, trash-icon visibility) are in scope — those were resolved as non-issues or one-off questions during exploration.

## Critical Decisions
- **KPI tile data source**: "Exercise Volume" tile switches from summing this session's own sets to showing the last-completed-session's volume for that exercise, reusing the existing last-time/history data already loaded for prefill (`lib/setHistory.ts` / history payload) — no new query needed.
- **One-line row scope**: applies at all widths, including ~400px phone, so `Target: 3 sets × 8-10` gets abbreviated (e.g. `3×8-10`) and the exercise-feedback thumbs (`ExerciseThumbs`) move into the same flex row as `ModeToggle` + `UnitToggle`, rather than sitting in their own block below.
- **Takeover persistence**: move "seen" state from `localStorage` (`lib/weekPodiumSeen.ts`) to the database, keyed by user + week, so it's shared across devices/PWA-vs-browser. Applies to **both** `WeekPodiumTakeover` (medals) and `WeekMissTakeover` (missed week) — same bug, same fix.
- **Timing unchanged**: the takeover still shows once per user per closed week, any day of that week (not restricted to Monday only) — only the "have I already dismissed it" tracking changes, not when it's eligible.

## Examples: Mike & Kevin, week over week

Pulled directly from `workout_sessions.completed_at` while answering the one-off question — this is the real shape of the data the takeover/podium logic runs against, useful for reasoning about when a takeover should (and shouldn't) reappear.

| Week (Mon–Sun, Eastern) | Kevin completed | Mike completed | Kevin locked (≥4)? | Mike locked (≥4)? |
|---|---|---|---|---|
| Aug 17–23 | 4 | 4 | ✅ | ✅ |
| Aug 24–30 | 4 | 5 | ✅ | ✅ |
| Aug 31–Sep 6 | 4 | 4 | ✅ | ✅ |
| Sep 7–10 (in progress) | 2 | 4 | — | ✅ |

**Worked example of the current bug**: say Kevin finished Aug 24–30 in 2nd place. Under today's logic, the first `GET /api/week-podium` call after Monday Aug 31 returns `you: { place: 2, weekMonday: "2026-08-24" }` on *every* Home load that week — the only thing stopping the takeover from firing again is a `localStorage` key `workit_week_podium:1:2026-08-24` = `"1"` written the moment Kevin dismissed it. If Kevin opens the app from his phone's home-screen PWA on Monday (sees + dismisses it, key written there) and then opens Safari directly on Tuesday, Safari has no such key — same account, same week, takeover fires again. This is exactly the cross-device repeat being fixed.

**Worked example of the fix**: with a DB-backed "seen" record (e.g. a row keyed by `user_id` + `week_monday`), dismissing the takeover in the PWA writes a row the API can see. Opening Safari the next day, `GET /api/week-podium` checks that row server-side and simply omits `you` (or includes a `seen: true` flag) — no takeover, regardless of which device or browser asks.

## Tasks:

- [x] 🟩 **Step 1: Exercise Volume tile → last-time-done**
  - [x] 🟩 Wire the last-completed-session volume for the current exercise into `LiveSetKpis` (via the data already available in `ExerciseTracker.tsx`, e.g. `historyData`/`lastSets`)
  - [x] 🟩 Update the tile label/subtitle so "last time" is visually distinct from the other three (still-current-session) tiles

- [x] 🟩 **Step 2: One-line exercise-card row**
  - [x] 🟩 Move `ExerciseThumbs` into the same flex row as `ModeToggle` + `UnitToggle` (currently a separate block) in `ExerciseTracker.tsx`
  - [x] 🟩 Abbreviate the "Target: X sets × Y" text so the full row (target + pills + thumbs) fits without wrapping at ~400px
  - [x] 🟩 Verify at phone width and desktop width that nothing wraps or clips

- [x] 🟩 **Step 3: Server-side "seen" tracking for week takeovers**
  - [x] 🟩 Add a DB-backed seen record keyed by user + week (new table or column, following the existing `week_podium` migration pattern in this repo)
  - [x] 🟩 `GET /api/week-podium` marks/reads seen state server-side instead of the client relying on `lib/weekPodiumSeen.ts`
  - [x] 🟩 Apply the same fix to the missed-week takeover path (`WeekMissTakeover`)
  - [x] 🟩 Remove/retire the `localStorage`-only gating once server-side seen-state is in place
