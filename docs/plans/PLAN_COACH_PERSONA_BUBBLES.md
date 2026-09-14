# Coach Persona Bubbles Implementation Plan

**Overall Progress:** `92%`

## TLDR
Replace the pure-text coaching moments during a live `/workout` session (resume, complete, gain/loss, hardness call, PR, bonus/optional complete) with a persistent circular coach avatar docked bottom-right that swaps expression per moment, paired with an auto-fading glassmorphic bubble carrying the same copy. Add the matching avatar image to the full-screen takeovers that stay as-is (Exit, Awards, Recap, Week miss, Week podium). Extend the same 6-expression photo set into coach-voiced emails, consolidate the complete/badge/belt emails into one send, and prepend the inviter's name to invite email subjects. Preview: [Coach Bubble Preview](https://claude.ai/code/artifact/d7ecfa35-7333-40ab-9134-d5c1686a983b).

## Critical Decisions
- **Asset source**: `personas/` folder (repo root, untracked) — one PNG per coach/expression, `{Expression} {CoachName}.png`. Happy/Mad/OK have 2–3 variants per coach; Welcome/Close/Celebratory have exactly one. Move into `public/personas/` so both the client and email sends can serve them by URL.
- **Filename normalization**: fix the `Gray`→`Grey` typo and the space-based naming only in the code's asset-lookup map, not by renaming the source files.
- **Scope split**: only pure "coach says a line" moments become the floating avatar + bubble. Exit, Awards, Recap, Week miss, and Week podium keep their existing full-screen takeover components untouched, just gain a small avatar image.
- **Expression mapping (in-app)**: Resume → Welcome · Gain(up) → Happy · Loss(down) → Mad · Hardness call → OK · PR → Celebratory · Exit(full-screen) → Close.
- **`CompleteTakeover` stays full-screen, unchanged** (correction made during Step 3): it's the middle screen of a load-bearing sequential flow (Recap → Complete → Awards) driven by `FinishStepper`, and it's also reachable from the Select Workout screen for a bonus-only activity finish — a path with no live session and therefore no `CoachBubble` dock mounted at all. Converting it to a bubble would either break that path or require restructuring the finish sequence, both out of scope. Complete/Bonus-complete/Optional-complete lines keep going through `CompleteTakeover` exactly as before.
- **Expression mapping (full-screen)**: Exit → Close, Awards → Celebratory, Recap → Happy, Week miss → Mad, Week podium → Celebratory.
- **Expression mapping (email)**: Welcome → Welcome · Invite → Welcome · PIN reset → OK · Complete/recap (+badge/belt) → Happy, or Celebratory when that send includes a badge or belt · Weekly scoreboard → Celebratory (fixed) · Nudge, first reminder for a week/day target → OK · Nudge, repeat reminder for that same target → Mad.
- **Variant handling**: where an expression has multiple photos, pick one at random per occurrence (both in-app and email).
- **Stacking**: multiple bubbles may queue/coexist near the avatar instead of the current strict one-at-a-time priority (PR > gain/loss > hardness).
- **Scope boundary**: floating avatar lives only inside an active `/workout` session — Home takeovers (Week miss, Week podium) are unaffected beyond the added static avatar image.
- **Replay**: tapping the avatar after its bubble has faded replays the same message with a fresh 5s window; tapping while a bubble is open is a no-op (the bubble's own tap/close still dismisses it).
- **Rest timer clearance**: `SetRestTimer` measures its own banner's real rendered height (via `ResizeObserver`, not a guessed constant) and reports it upward through `ExerciseTracker` to the `/workout` page, which passes that exact pixel value to `CoachBubble` as `liftPx` — the dock sits `liftPx + 12px` above the bottom edge while the banner is open, so it can't end up underneath it regardless of banner content/height. (A first pass used a hardcoded rem offset that undershot the banner's actual height, letting the higher-z-index banner paint over the avatar — fixed by measuring instead of guessing.)
- **Email consolidation**: `queueWorkoutCompleteEmails` merges the recap, belt, and badge sends (today up to 3 separate emails) into a single email per completed session.
- **Invite subject**: `An invitation from <inviter's name>` is prepended to the existing tone-based subject on every invite send, including resends (e.g. `An invitation from Kevin — Report in. Work-It.`).

## Tasks:

- [x] 🟩 **Step 1: Asset pipeline**
  - [x] 🟩 Move `personas/` into `public/personas/`, normalized filenames (e.g. `master-welcome.png`, `james-happy-2.png`)
  - [x] 🟩 Add a coach/expression → asset-list lookup (`lib/coachPersonas.ts`) with random-variant picker, covering the `Gray`→`Grey` fix

- [x] 🟩 **Step 2: Floating avatar + bubble component (in-app)**
  - [x] 🟩 Build `CoachBubble` component: bottom-right circular avatar (idle pulse), glass bubble (kicker/title/body), 5s auto-fade, tap-to-dismiss, replay-on-tap when idle
  - [x] 🟩 Support a queue so multiple bubbles can stack instead of dropping lower-priority ones
  - [x] 🟩 Shift position clear of `SetRestTimer`'s bottom banner while it's open — `SetRestTimer` measures its real rendered height via `ResizeObserver` and reports it upward (`onBannerChange` → `ExerciseTracker.onRestBannerChange` → page `restBannerLift` state → `CoachBubble`'s `liftPx`), after an initial guessed-offset version let the banner paint over the avatar
  - [x] 🟩 Keep existing vibration/horn triggers at each call site (kept inline at the trigger, not inside `CoachBubble`, since each moment's side effect differs)

- [x] 🟩 **Step 3: Wire in-app moments to the new component**
  - [x] 🟩 Resume, Gain/Loss, Hardness call, PR now route through `CoachBubble` with the mapped expression
  - [x] 🟩 Removed `PrFlash` and `SetProgressFlash` (superseded) and `ResumeTakeover` (superseded)
  - [x] 🟩 Exit keeps `ExitTakeover` as-is; Complete/Bonus-complete/Optional-complete keep `CompleteTakeover` as-is (see Critical Decisions correction above)

- [x] 🟩 **Step 4: Avatar on full-screen takeovers**
  - [x] 🟩 Added a `tone: CoachTone` prop + small coach-avatar image above the kicker in `ExitTakeover` (Close), `AwardsTakeover` (Celebratory), `WorkoutRecapTakeover` (Happy), `WeekMissTakeover` (Mad), `WeekPodiumTakeover` (Celebratory), wired from `coachTone` (`/workout`) / `userTone` (`/home`) at every call site

- [x] 🟩 **Step 5: Email images**
  - [x] 🟩 Added `coachPersonaArt(tone, expression)` to `lib/emailLayout.ts` (circular `<img>`, hosted via existing `hostedAsset()`) and wired it into `buildWelcomeEmail` (Welcome), `buildInviteEmail` (Welcome), `buildPinResetEmail` (OK, always Master's voice — pre-existing, unchanged), `buildNudgeEmail` (OK first reminder / Mad repeat), `buildScoreboardEmail` (Celebratory, fixed)
  - [x] 🟩 Images serve from `public/personas/` via `hostedAsset()` (always the live host, same pattern belt/badge art already uses)
  - [x] 🟩 `lib/emails/nudge.ts` now checks `email_sends` for a prior `nudge` row with the same week/day dedupe suffix (ignoring the date prefix) to compute `isRepeat` before building the email

- [x] 🟩 **Step 6: Consolidate complete/badge/belt email**
  - [x] 🟩 `buildWorkoutCompleteEmail` now takes optional `badges` / `belt` and rolls their art + copy into the same email (subject gets `· <Belt name> diploma` or `· <Badge name>` appended); `buildBadgeEmail` / `buildBeltEmail` left untouched since `/admin/mail` still uses them standalone for template preview/sample-send
  - [x] 🟩 `sendWorkoutCompleteBundle` in `lib/emails/lifecycle.ts` now makes one `claimAndSend` call per session instead of up to three
  - [x] 🟩 Persona image: Celebratory when that send includes a badge or belt, else Happy

- [x] 🟩 **Step 7: Invite email subject**
  - [x] 🟩 `buildInviteEmail`'s subject is now `An invitation from <inviterName> — <existing tone subject>` for all tones, including resends (same builder)

- [ ] 🟨 **Step 8: QA pass**
  - [x] 🟩 `npx tsc --noEmit` passes clean across all changed files
  - [x] 🟩 Live-tested resume bubble and rest-timer clearance as **Test** — caught the avatar sitting under the rest banner (guessed offset too short), fixed by measuring the banner's real height instead
  - [x] 🟩 Live-tested a "silent" gain/loss case (fell through to the Honest-set effort call) — confirmed as existing `setDirection` behavior (same-or-lower weight with reps not down is deliberately silent), not a regression
  - [x] 🟩 Avatar size bumped 56px → 96px per feedback
  - [ ] 🟥 Still to try: replay-on-tap, bubble stacking, a genuine PR and a genuine "down" gain/loss, full-screen takeover avatars at the bigger size (not yet asked for)
  - [ ] 🟥 `/admin/mail` preview for welcome, invite, PIN reset, nudge (first + repeat), scoreboard, consolidated complete email (plain / with badge / with belt) — not yet run
