# Feature Implementation Plan — Quieter Coach

**Overall Progress:** `90%`

## TLDR
The coach talks too much during a live session: up to ~37 spoken lines on a typical 18-set, 6-exercise day, driven mostly by the rest-over takeover after every set. This change cuts it to ≤ 14:
- When the rest timer ends, the screen just says **Next**, with no voice.
- The phase line (initial / mid / final) becomes a **mid-set motivator** in the coach bubble: **one per exercise**, on a random set, 10–30 s after that set's rest ends.
- At the end of an exercise the coach says **only one** line, the first that applies: **New PR → Gains → Effort call**. Losses are gone.

## Critical Decisions
- **Motivator in the coach bubble, not full screen:** it lands mid-set, so it must not block logging. Kevin confirmed the bubble.
- **"Next" is text + horn + vibration, no voice:** no new clips, no DB change. Skip shows the same "Next".
- **Random pick = one set number per exercise, chosen once:** a uniform pick from `2..exercise.sets`, stored in a ref. Set 1 is excluded because the rest before it belongs to a different exercise. Exercises with 1 planned set get no motivator. Extra sets and Editing never re-arm it.
- **Motivator dropped if the set completes first:** it is "during the set". Missing one means less talk, which is the goal. No retry.
- **End-of-exercise is first-match, each tier still gated by its own Noise Control switch:** PR needs `showPrs`; Gains needs `noiseTakeover` and direction `up`; Effort needs `noiseEffort`. If a tier is off or doesn't apply, the next one is tried.
- **Applies everywhere `ExerciseTracker` runs:** main, Hyrox, Overload, Test Drive and Your pick Upper / Lower / Full body. Yoga/Core and optionals don't use it.
- **Unchanged:** start/resume, Exit and Complete lines.

## Tasks:

- [x] 🟩 **Step 1: Rest end says "Next"** ([components/SetRestTimer.tsx](../../components/SetRestTimer.tsx), [components/GetToItModal.tsx](../../components/GetToItModal.tsx))
  - [x] 🟩 `GetToItModal`: drop `line` / `clipTemplate` / `tone` props and the `playCoachClip` effect, and render **Next**. Keep the horn, vibration, tap-to-close and 10 s auto-dismiss.
  - [x] 🟩 `SetRestTimer`: drop the `line` / `clipTemplate` / `tone` props and add an `onRestEnd?: () => void` callback. It fires once when the clock hits 0 or Skip is tapped, and not when `cancelled`.

- [x] 🟩 **Step 2: Mid-set motivator** ([components/ExerciseTracker.tsx](../../components/ExerciseTracker.tsx))
  - [x] 🟩 Remove the `restLine` / `restClip` state and the `pickCoachClip` call in `updateSet`'s `startRest` branch, which only sets the rest seconds and token now.
  - [x] 🟩 Add refs:
    - `motivatorSetRef` (exercise name → chosen set number, picked lazily from `2..exercise.sets`);
    - `motivatedRef` (exercises already motivated);
    - `armedMotivatorRef` (the pending exercise name plus the next set number, or null);
    - `motivatorTimerRef`.
  - [x] 🟩 In `completeSet`, after a planned set `k` completes with rest, arm the motivator when `k + 1` is that exercise's chosen set and it isn't motivated yet.
  - [x] 🟩 `onRestEnd`: if one is armed, start a timeout of 10–30 s (random). When it fires, call `onCoachMoment` with `pickCoachClip(completed, total, tone, athleteName)`: kicker `Keep going`, expression `happy`, `clipTemplate` from the pick. Then mark the exercise motivated.
  - [x] 🟩 Cancel the pending timeout and disarm at the start of every `completeSet` and on unmount.

- [x] 🟩 **Step 3: One end-of-exercise line, first match** ([components/ExerciseTracker.tsx](../../components/ExerciseTracker.tsx) `pendingFinishRef` closure)
  - [x] 🟩 Replace the three independent `onCoachMoment` calls with an if / else-if chain: PR (`pendingPr && showPrs`) → Gains (`noiseTakeover === 'set' && direction === 'up'`) → Effort (`noiseEffort === 'set'`).
  - [x] 🟩 Remove the "Set down" / `mad` path. `setProgressCopy` is only called for `up`.

- [x] 🟩 **Step 4: Docs**
  - [x] 🟩 `CLAUDE.md`: update the live-session coach text:
    - rest-over takeover → "Next";
    - the new once-per-exercise mid-set motivator;
    - first-match PR → Gains → Effort, no losses;
    - the Noise Control description where it says all three queue.
  - [x] 🟩 `app/help/page.tsx` Your Coach section and `docs/WHAT_IS_WORKIT.md`, if either describes rest-over lines or gain/loss.

- [ ] 🟨 **Step 5: Verify**
  - [x] 🟩 `npm run build` passes; `npm run lint` is broken in this Next version (`next lint` gone), so ran `npx eslint` on the changed files instead: no new errors vs `main`.
  - [ ] 🟥 As **Test** (PIN `0000`), run a session:
    - rest end shows "Next" with no voice;
    - each multi-set exercise gets at most one bubble 10–30 s into a set;
    - completing that set early drops the bubble;
    - each exercise's last set gives exactly one line;
    - a weight drop is silent.
