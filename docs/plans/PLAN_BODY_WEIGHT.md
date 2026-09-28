# Feature Implementation Plan — Body Weight History + Bodyweight Scoring

**Overall Progress:** `90%`

## TLDR
Today `users.body_weight_lb` is stored and overwritten, and nothing uses it. Bodyweight sets logged at 0 lb add **0 volume**. This change does two things:

1. **History:** every body-weight save becomes a dated row. The athlete sees a save confirmation, a trend chart, a check-in prompt every 6 program weeks, and a line in the recap (in the app and in the email). Kevin sees each athlete's history. It never appears on house boards, and coaches never react to it.
2. **Scoring:** a set of a listed bodyweight movement counts as `(share × body weight + logged weight) × reps`. Any weight the athlete logs is extra on top of that. The athlete no longer has to work anything out.
3. **Missing-weight banner:** an athlete with no weight on file sees a banner when they start a workout, linking straight to the weight field. It shows for their next 3 workouts, or until they save a weight. Today that means Mike and Peter, the only active athletes with no weight on file.

## Critical Decisions
- **Snapshot per set, not a live join:** a new column `exercise_sets.bodyweight_lb` stores the credited body-weight load when the set completes. Later weight changes never rewrite old sets. `sqlSetVolume` / `setVolume` stay the single volume source (40 SQL call sites and 9 client call sites), so it's a one-place change.
- **Explicit allow-list, not the keyword match:** `getExerciseKind`'s name match wrongly tags loaded lifts as bodyweight: Barbell Hip Thrusts or Glute Bridges (55 sets logged) and Leg Extension Machine or Goblet Step-Ups (48 sets). It also tags backpack, isometric (ISO) and arm-only moves. So a new `lib/bodyweightShare.ts` holds an exact exercise name → share map, and **only names on that list get credit**. There is no default share.
  - **In:** Push-Ups, Incline / Close-Grip / Pike Push-Ups, Bench Dips, Bodyweight Triceps Extensions, Bodyweight Squats, Tempo Squats, Bodyweight Bulgarian Split Squats, Bodyweight Walking or Reverse Lunges, Bodyweight Step-Ups or Sissy Squats, Bodyweight Single-Leg RDLs, Single-Leg Good Mornings, Single-Leg Glute Bridges, Hamstring Walkouts, Lying Hamstring Floor Slides, Single-Leg Bodyweight Calf Raises, Towel Door Rows or Table Inverted Rows, Doorframe Towel Rows or Sliding Floor Lat Pulls, Floor Leg Raises or Bodyweight Wall Rollouts, Floor Pullovers, **Hanging Knee Raises or Ab Wheel Rollouts**
  - **Out:** the two loaded combo lifts; Backpack moves (the backpack is the load); ISO holds; Doorframe Rear Delt Flyes and Prone Y-T-W Raises (arm-only); Dead Bugs (limbs only); every timed hold (Plank, Side Plank)
  - Share values are first drafts for Kevin to review (push-up ≈ 0.64, dip ≈ 1.0), the same approach `lib/altExercises.ts` took.
- **Weight field label follows the list:** listed movements read "Extra weight (optional)". The loaded combo lifts lose their wrong "0 = BW" label.
- **No body weight on file = 0 credit** (today's behaviour). The check-in prompt is how the athlete fills it in.
- **Past sets:** a one-time backfill credits existing completed bodyweight sets using the athlete's **current** weight, since that's the only weight we have. This changes past totals, PRs, badges and ranks, which you asked for.
- **`users.body_weight_lb` stays as the "current" value.** The history table sits beside it, so nothing that reads it today breaks.
- **Check-in cadence:** the weight check-in goes into the existing every-6-program-weeks `ScheduleDaysAskTakeover` and the `schedule_days_ask` email. That avoids a second takeover on the same Home open.
- **Banner count is derived, not stored:** it shows while `body_weight_lb` is NULL and the athlete has started ≤ 3 sessions since `BODY_WEIGHT_BANNER_SINCE` (the ship date), counting the one being started. Nothing new is persisted, the same pattern Test Drive uses. Saving a weight hides it at once.
- **Deep link:** `?profile=weight` opens `EditProfileModal` over the current page, scrolled to Weight with the field focused, so the live session stays open.
- **Why-we-ask copy** (one shared constant, shown in the banner and under every weight field: join, Edit profile, check-in): *"We use your weight to count bodyweight moves like push-ups and dips. Anything you add on top counts extra. Only you and Kevin see it."*
- **Neutral tone:** confirmation copy only, no coach lines, and no up/down judgment.
- **Units:** stored in lb. Entry fields get the same lb/kg toggle as the live cards (`UnitToggle`, enter kg, store lb).

## Tasks:

- [x] 🟩 **Step 1: Schema**
  - [x] 🟩 `database/migrate-body-weight.sql`: `body_weight_log (id, user_id, weight_lb DECIMAL(6,1), source ENUM('join','profile','checkin'), created_at)` with an index on user+created_at; `exercise_sets.bodyweight_lb DECIMAL(6,1) NULL`
  - [x] 🟩 Seed one `body_weight_log` row per user who already has `body_weight_lb`, dated to the migration
  - [x] 🟩 Apply with `scripts/apply-migration.ts`

- [x] 🟩 **Step 2: Log every save**
  - [x] 🟩 `lib/bodyWeight.ts`: `recordBodyWeight(userId, lb, source)` inserts a row only when the value changed, and updates `users.body_weight_lb`; `bodyWeightHistory(userId)`
  - [x] 🟩 Call it from `POST /api/join` (source `join`) and `PATCH /api/me` (source `profile`, or `checkin` when sent from the takeover)
  - [x] 🟩 `GET /api/body-weight` (own history); `?userId=` requires `requireAdmin`

- [x] 🟩 **Step 3: Share table + scoring**
  - [x] 🟩 `lib/bodyweightShare.ts`: exact-name map + `bodyweightShare(exerciseName)` (null when unlisted)
  - [x] 🟩 `POST /api/exercises`: when a listed movement's set completes, stamp `bodyweight_lb = round(share × users.body_weight_lb)` (0 if none on file)
  - [x] 🟩 `setVolume` / `sqlSetVolume` in `lib/exerciseKind.ts`: `(weight_lbs + COALESCE(bodyweight_lb,0)) × reps` for rep sets
  - [x] 🟩 `lib/setHistory.ts` (`betterSet`, gain/loss, `foldSetIntoHistory`) uses the same total load so Best/PR/History agree
  - [x] 🟩 Live card: show the credited load as a caption (e.g. `+ 118 lb body weight`); the weight field label follows the list (see Critical Decisions); `setLogLabel` shows the total

- [ ] 🟨 **Step 4: Backfill past sets**
  - [x] 🟩 Script `scripts/backfill-bodyweight-sets.ts`: for completed sets of listed movements with NULL `bodyweight_lb`, stamp share × the user's current weight; dry-run mode prints per-athlete lb added
  - [ ] 🟨 Recompute `daily_stats` / `users.total_weight_lifted` for affected athletes; re-run badge check (weight badges)
  - [ ] 🟨 **Waiting on Kevin's OK to run `--apply`** — dry run 2026-09-27: Kevin +17,997 lb (18 sets, 6 sessions), Christine +2,520 lb (6 sets, 2 sessions); the script recomputes daily_stats + badges when applied

- [x] 🟩 **Step 5: Save confirmation**
  - [x] 🟩 `EditProfileModal` and `UpdateProfileGate`: when the weight changed, show a neutral confirmation `Weight saved · 182 lb`; add the lb/kg toggle

- [x] 🟩 **Step 6: Trend chart**
  - [x] 🟩 `components/BodyWeightChart.tsx`: line of history (cream), dated points, latest value; athlete-only
  - [x] 🟩 Add a folded **Body weight** section to Your performance (`app/performance/page.tsx`)
  - [x] 🟩 Admin → Analytics → Athletes: per-athlete chart via `?userId=`; never on The house, You vs, or the scoreboard email

- [x] 🟩 **Step 7: Check-in prompt**
  - [x] 🟩 `ScheduleDaysAskTakeover`: add a weight field (pre-filled, optional); Save sends it with source `checkin`
  - [x] 🟩 `schedule_days_ask` email: add a line asking them to update their weight, showing the last one and its date

- [x] 🟩 **Step 8: Recap mention**
  - [x] 🟩 `WorkoutRecapTakeover` + `buildWorkoutCompleteEmail`: when the session had bodyweight sets, add one neutral line such as `Body weight used: 182 lb (saved Sep 3)`; if none is on file, add a line prompting them to add it in Edit profile

- [x] 🟩 **Step 9: Missing-weight banner + why-we-ask copy**
  - [x] 🟩 `lib/bodyWeight.ts`: `BODY_WEIGHT_WHY` copy constant + `BODY_WEIGHT_BANNER_SINCE`; `GET /api/sessions` returns `bodyWeightBanner: boolean` (weight NULL and ≤ 3 sessions started since that date)
  - [x] 🟩 `components/BodyWeightBanner.tsx`: shown at the top of a newly started or resumed live session (`app/workout/page.tsx`); copy + gold **Add weight** link to `?profile=weight`
  - [x] 🟩 Also on Home above the hero (Kevin, 2026-09-27): shows from before the next workout through the 3rd; Add weight opens Edit profile via `AppMenu` `editWeightSignal`
  - [x] 🟩 `EditProfileModal`: `focusWeight` prop → scroll to and focus the Weight field. The live workout page has no `AppMenu`, so `app/workout/page.tsx` mounts the modal itself when the banner is tapped. Elsewhere, `AppMenu` reads `?profile=weight`, opens the modal and removes the param on close.
  - [x] 🟩 Show `BODY_WEIGHT_WHY` under the weight field in `/join`, `EditProfileModal`, `UpdateProfileGate`, `ScheduleDaysAskTakeover`

- [x] 🟩 **Step 10: Docs**
  - [x] 🟩 Update `CLAUDE.md` (schema, scoring rule, routes), `app/help/page.tsx` Glossary (bodyweight credit), `docs/WHAT_IS_WORKIT.md`
