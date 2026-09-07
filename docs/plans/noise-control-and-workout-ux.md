# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR
Let athletes turn down the app's cognitive/message load ("Noise Control") and fix a handful of live-workout UX papercuts: a broken Home medal layout, cramped exercise cards during a session, an easy-to-miss rest timer, a plank timer that requires a redundant tap, and a last-time chip that's missing effort context. All changes are additive or copy/layout fixes — no existing data model or flow is removed.

## Critical Decisions
- **Two independent Noise Control dials** (Set / Exercise / Off), not one combined setting — post-set flash takeovers and perceived-load flash takeovers are governed separately. Voting itself (tapping 1–5 on How hard?) always stays per-set; the dial only changes when the resulting flash is *shown*.
- **Exercise-level takeover fires once**, after the last set of that exercise, reusing the same message styles (gain/loss + hardness-call), plus average effort and average weight/volume trend vs. last time when space allows.
- **"Show New PRs" is a separate on/off toggle**, not part of either 3-way dial. PRs always appear in the completion/recap email regardless of this toggle.
- **Rest-timer copy and the new exercise-end takeover both drop "first/second/last third" language** in favor of "beginning of the workout / halfway through / final sets."
- **Edit Profile becomes sectioned**: Coach voice, Noise Control (new, between Coach voice and Sound), and Workout sound all render as folded (collapsed-by-default) sections. Extra rest and the rest of the form are unaffected.
- **Home medal**: keep its current top-right position, but stop it from sharing flex width with the title/hold-line text (overlay it) so that text always spans the full card width.
- **Workout page scroll-collapse** is automatic (not tap-to-fold): the week/focus/timer block plus the Today/All-time KPI row collapses into the sticky Exit/Restart bar on scroll down, and restores on scroll back to top.
- **Rest timer** gets both a persistent sticky presence and louder visual/haptic escalation near zero — not a full-screen blocker, so scrolling to preview next/previous work stays possible.
- **Timed-exercise Stop = Complete**: stopping the plank/timed clock both records held seconds and marks the set completed in one action.

## Tasks:

- [x] 🟩 **Step 1: Noise Control settings — data & profile UI**
  - [x] 🟩 Add `noise_takeover`, `noise_effort`, `show_prs` columns/prefs (default: `set`, `set`, `true`) to wherever `coach_tone`/`sound_on`/`rest_extra_minutes` are stored and read (`lib/auth.ts` prefs, `/api/me` PATCH/GET)
  - [x] 🟩 Add a small `lib/noisePref.ts` normalizer (mirrors `lib/restPref.ts` / `lib/soundPref.ts` pattern)
  - [x] 🟩 Rework `EditProfileModal.tsx` into folded sections: Coach voice, new **Noise Control** (two 3-way pickers + PR toggle), Workout sound — all collapsed by default, reusing `HomeFold`
  - [x] 🟩 Wire save/load of the three new fields through the existing profile save flow (`AppMenu`, `/api/me`, `app/workout/page.tsx`)

- [x] 🟩 **Step 2: Post-set takeover dial (ExerciseTracker)**
  - [x] 🟩 Pass the athlete's `noise_takeover` pref into `ExerciseTracker`
  - [x] 🟩 `Set`: unchanged (fires `SetProgressFlash` after every set)
  - [x] 🟩 `Exercise`: defer the flash until the exercise's last set completes; compute average trend vs. last time (volume-based) for that exercise's sets and show one summary flash
  - [x] 🟩 `Off`: skip the post-set flash entirely
  - [x] 🟩 Update `lib/coachLines.ts` copy that references "first third/last third" to plain "final sets" language (used by both the rest line and the new exercise-summary flash)

- [x] 🟩 **Step 3: Perceived-load takeover dial**
  - [x] 🟩 Voting (`SetHardness`) stays per-set, no change to when it's asked
  - [x] 🟩 Gate the resulting `hardnessCopy` flash by `noise_effort`: `Set` = every set (current), `Exercise` = show once after the exercise's last hardness vote (using the exercise's average score), `Off` = never show (score still saves silently)

- [x] 🟩 **Step 4: PR flash toggle**
  - [x] 🟩 Gate `PrFlash` display by the new `show_prs` toggle in `ExerciseTracker` (falls back to the progress flash when suppressed)
  - [x] 🟩 Confirm the completion/recap email PR content path is untouched (always includes PRs — history/record tracking is unconditional, only the in-app flash is gated)

- [x] 🟩 **Step 5: Last-time chip effort**
  - [x] 🟩 Add `hardness` to the `history=1` query/response in `app/api/exercises/route.ts`
  - [x] 🟩 Thread it through `lib/setHistory.ts` (`bestLoggedSet`, generic already covers it) and the `HistoryPayload` type
  - [x] 🟩 Render `· Effort {score}` on the "Last time" chip in `ExerciseTracker.tsx`, defaulting to Fair/3 when no historical hardness is recorded

- [x] 🟩 **Step 6: Timed exercise Stop = Complete**
  - [x] 🟩 In `ExerciseTracker.tsx`'s `TimedSetTimer onStop` handler, call the same completion path as `completeSet` (added an `overrideReps` param so held seconds run through the normal PR/flash/history/rest logic) instead of only updating `actual_reps`

- [x] 🟩 **Step 7: Home medal layout fix**
  - [x] 🟩 In `app/home/page.tsx`, made the medal `float-right` inside the title column instead of a flex sibling (plus a `clear-both` spacer) — title/hold-line text wraps around it near the top and reclaims the card's full width below it, regardless of title wrap length

- [x] 🟩 **Step 8: Workout page scroll-collapse header**
  - [x] 🟩 Add scroll-position tracking (`headerCollapsed` state + `window` scroll listener with hysteresis) to the live session view in `app/workout/page.tsx`
  - [x] 🟩 Collapse the week/focus block and the Today/All-time KPI row (`SessionTotalsBar`) into the sticky Exit/Restart bar once scrolled down (`max-h-0 opacity-0` transition); restore on scroll back to top
  - [x] 🟩 Keep Exit/Restart/clock/sound always visible in the sticky bar, collapsed or not (moved the desktop clock out of the collapsible title block, next to the sound toggle)

- [x] 🟩 **Step 9: Rest timer visibility**
  - [x] 🟩 `SetRestTimer` was already a `fixed` overlay (stays visible while scrolling); no change needed there
  - [x] 🟩 Added stronger visual/haptic escalation in the final 5 seconds (gold pulse + vibration tick each second, reusing existing `armRestAlarm`/vibration pattern)

- [x] 🟩 **Step 10: Post-set visual guide**
  - [x] 🟩 Reduce card/set font sizes by 1pt in `ExerciseTracker.tsx`
  - [x] 🟩 Move the `ExerciseThumbs` up/down bar next to the `ModeToggle`/`UnitToggle` row
  - [x] 🟩 Add a gold border highlight on the current active (next-to-complete) set, and on `SetHardness` the first time it appears for a completed set (new `highlight` prop)
