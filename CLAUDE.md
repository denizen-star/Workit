# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

"Work-It" — a Next.js PWA for tracking a 6-week upper/lower workout split, used by a household of users authenticated via a name + optional 4-digit PIN (no email/password signup). Deployed on **Netlify** at `workit.kervinapps.com`. Data lives in PlanetScale (MySQL, serverless HTTP driver). Coach voices: **Master Tom Iron** (`master`) and **Luna Meadows** (`sergeant`). Address the athlete as **man**, not boy.

## Commands

```bash
npm run dev                # start dev server (localhost:3000)
npm run build              # production build
npm run lint               # next lint
npm run mail:release       # send release-notes email (needs .env.local SMTP)
npm run mail:scoreboard    # send live household scoreboard (needs .env.local SMTP)
```

No test suite.

## Architecture

**Auth flow**: Session-based, not NextAuth. `lib/session.ts` issues/verifies an HS256 JWT (`jose`) in the `workit_session` cookie, signed with `AUTH_SECRET` (≥32 chars). `lib/auth.ts` wraps PIN hashing (scrypt), in-memory lockout (resets on redeploy), and `requireCurrentUser`/`requireAdmin`. `middleware.ts` gates every request except static assets (incl. `/sounds/`, `/badges/`, `.wav`), `/api/cron/*`, `POST /api/analytics/event`, `/who`, `/api/auth/*`, and `GET /api/users`. `/` redirects: session → `/home`, else `/who`. Other unauthenticated pages → `/who`; unauthenticated APIs → 401 JSON. User id `1` is the sole admin (`ADMIN_USER_ID`).

**Database**: `lib/db.ts` `query(sql, params)` via `@planetscale/database` HTTP `connect()`. Schema in `database/schema.sql` (users, workout_sessions, exercise_sets, badges, user_badges, daily_stats, exercises, coach_voices, coach_lines). Incremental SQL is applied by hand: `migrate-pin.sql`, `migrate-timing.sql`, `migrate-email.sql` (`email_sends` dedupe table), `migrate-tone.sql` (`users.coach_tone`; already on prod — re-run = duplicate column), `migrate-sound.sql` (`users.sound_on`), `migrate-badges-20.sql` (20 extra badge rows), `migrate-coach-lines.sql` (`coach_voices` + `coach_lines`; no per-user last-line table), `migrate-workout-mode.sql` (`workout_sessions.workout_mode` gym/travel + Travel Survivor copy), `migrate-app-events-user.sql` (shared `app_events.user_id` / `user_name` / `user_email`; already on prod — re-run = duplicate column/index), `migrate-feedback.sql` (`feedback` + `session_ratings`; re-run = duplicate table), `migrate-bonus-badge.sql` (`bonus_sessions` / Bonus Day; already on prod — re-run = duplicate row), `migrate-bonus-coach-lines.sql` (`bonus_complete` lines for both voices; already on prod — re-run = duplicate rows), `migrate-optionals.sql` (warmup/cooldown track + lbs + kicker on `workout_sessions`; already on prod — re-run = duplicate column), `migrate-optional-badges.sql` (`optionals` / `optional_weeks`; already on prod — re-run = duplicate ignore), `migrate-optional-coach-lines.sql` (`optional_complete` for both voices; already on prod — re-run = duplicate ignore). No migration runner. `users.coach_tone` stays `master`/`sergeant`. Lines/descriptions live in those two tables; `GET /api/coach-catalog` hydrates the client. Shuffle is in-memory only. Code banks in `lib/coachLines.ts` / `lib/coachCatalog.ts` are fallback if the tables are empty.

**Workout program is static**: `lib/workoutData.ts` is the 6-week gym plan (Week 2 is gym, not a travel week). Weeks 3–6 add optional **Bonus Upper** (`WorkoutDay.bonus`). Week lock / perfect week = **any 4** completed sessions (`lib/bonusDay.ts` `REQUIRED_DAYS_TO_LOCK`). Home Start, nudges, and `findNextProgramDay` skip bonus; an open bonus session still resumes. Count = one completed bonus per week (Do Again does not increment; detect via `workout_type` containing Bonus + program flag). Home flag hidden if the week has no bonus day; after the last bonus week, keep the tally if count > 0. Rest-between-uppers copy is a hint, not a lock. Travel is a per-session mode: `lib/travelExercises.ts` substitutions via `applyWorkoutMode()`. Home **Start Workout** POSTs `workout_mode=gym`. Select Workout: Gym/Travel pill on unstarted or in-progress days (resume locks the mode); finished days use `CompletedSessionCard` (same card as the Home log) with a small **Do Again** on the header and actual duration, not Est. Locked weeks (4 finished sessions) start folded (`lib/nextWorkout.ts` `defaultSelectWeek`); an open session opens that week, else the next unlocked week. Restart returns to Start so they can pick again. `/workout?week=&day=` will not create a session if that day is already complete and nothing is open; **Do Again** still starts a new one. Extra sets: +5 cap, copy last completed, **Remove** only on uncompleted extras (`DELETE /api/exercises?id=`). Finished sets fold gray; tap to edit (yellow **Editing**). Session column `workout_sessions.workout_mode` (`gym`|`travel`). Travel Survivor (`travel_week`) = 4 completed travel-mode sessions. **Optional** warmup/cooldown on every live session (`components/OptionalCard.tsx`): Easy run, Easy bike, Easy stretch, Easy core. +500 lb per slot. Run/bike need 10 minutes wall clock. Stretch/core are five holds; Done on the last hold credits immediately (`circuitComplete`); 10-minute clock is fallback if they stop mid-circuit. Stretch/core stills + video live on the circuit step (do not look up via `getExerciseImages(title)`). Optional lbs count on Scoreboard volume, Vs the house Total weight, Home, recap, `daily_stats`, and weight badges. Best day stays lifts only. First 4 warmups + 4 cooldowns in the 7-day window: 25% gap kicker toward the total-weight lead (once). DB also stores logged sets plus the `exercises` catalog (images/video). Media maps: `lib/exerciseImages.ts`, `lib/exerciseMedia.ts`. Combined Hip Thrusts / Glute Bridges has two video tabs; Farmer's Carries + travel glute/farmer use the replacement YouTube ids.

**Routes**:
- `app/page.tsx` — backup redirect to `/who` (middleware usually handles `/`)
- `app/home/page.tsx` — dashboard (scoreboard folded, **Vs the house** folded, Achievements folded, Completed log folded under Weekly Progress). Week cards / **Completed** open that log. Bonus flag + unique-week tally when the week has a bonus day (`components/BonusFlag.tsx`). Optional flag (`components/OptionalFlag.tsx`): this-week warmup/cooldown counts + unique optional-week tally. Stat cards + progress charts show you / household avg of people who finished a workout in the last 7 days, **including you**, minus Test (`GET /api/stats` `household`; null if nobody trained). Week progress caps at 4. **Vs the house** (`GET /api/exercise-compare?period=7|30|all`): current athlete only; Best day / Total weight ranking plus two boards (best-day weight, best-day reps); hidden for Test. Optional lbs sit in Total weight only. Enjoyment charts if the athlete has session ratings. Scoreboard honor roll from `GET /api/scoreboard` (`householdBonusHonor`, `householdOptionalHonor`)
- `app/workout/page.tsx` — Select + logging. Locked weeks start folded. Finish and quit require 1–5 stars (`POST /api/session-ratings`). Exercise thumbs via `ExerciseThumbs`. Finished days share `CompletedSessionCard` with the Home log. Bonus days get Extra credit copy + rest-between-uppers hint. Optional warmup/cooldown on the live session (`OptionalCard`). Finish PUT returns `{ bonus, bonusCount, optionalLbs, kickerLbs }` for the takeover (`bonus_complete` / `optional_complete` lines)
- `app/history/page.tsx` — standalone completed log (`/history?week=&day=` still used by View leftovers)
- `app/who/page.tsx` — profile picker + PIN
- `app/admin/layout.tsx` — shared chrome: Dashboard back, title, hamburger
- `app/admin/page.tsx` — redirects to `/admin/analytics`
- `app/admin/analytics/page.tsx` — Kevin-only Traffic charts + people (name/email). Folded **Vs the house** for every athlete except Test (Best day / Total weight ranking + per-athlete boards); follows the Analytics range (`GET /api/exercise-compare?range=`)
- `app/admin/users/page.tsx` — household users; Add stays on this page
- `app/admin/feedback/page.tsx` — Kevin-only notes, thumbs, household enjoyment
- `app/admin/mail/page.tsx` — mail preview / sample send / run nudges / force scoreboard
- Admin hamburger (home + admin chrome): Analytics, Users, Feedback, Mail
- `app/api/*/route.ts` — one file per resource (`GET /api/scoreboard?period=7|30|all` includes bonus + optional honor rolls, `GET /api/stats` (includes `household`), `GET /api/exercise-compare?period=7|30|all` (current athlete; `?range=` is admin all-athlete), `GET /api/sessions?history=1` (completed sessions + completed sets), `GET /api/badges` includes `bonusCount` / `optionalWeekCount` / `optionalCount`, `POST /api/optionals` (start/complete warmup or cooldown; stretch/core may skip the 10-minute wait with `circuitComplete`), `GET /api/coach-catalog`, `GET /api/ratings/stats`, `GET|POST /api/feedback`, `POST /api/session-ratings`, `DELETE /api/exercises?id=` (uncompleted extras only), `GET /api/admin/analytics` are session-gated; analytics / admin feedback / household ratings / exercise-compare `?range=` also `requireAdmin`)
- `POST /api/analytics/event` — **not** session-gated; production only; stamps `user_*` from session when present
- `app/api/cron/mail` — GET/POST; **not** session-gated; requires `Authorization: Bearer $CRON_SECRET`

**Telemetry** (production only, `APP_NAME=workit`): papamkt-style ingest to shared PlanetScale `app_events`. Client: `lib/analytics.ts` + `AnalyticsProvider` in root layout. Server: `lib/trackServerEvent.ts`. Identity stamped server-side (`user_id` / `user_name` / `user_email`). Name/email never go in `page_url` / `cta_type` / `device_info`. `/who` taps fire `who_pick` with the tapped name in `article_context` only. kervinapps.com dashboard must not SELECT `user_*`. Identified view is `/admin/analytics`.

**Email** (Zoho SMTP, same stack as hit-list/Gowanus):
- Client: `lib/mailClient.ts` (nodemailer). `EMAIL_ENABLED` empty/true sends; SMTP missing → skip. From display: `voiceFromName()` from `coach_voices` (fallback Master Tom Iron / Luna Meadows). Every send BCCs `info@kervinapps.com`.
- Layout/templates: `lib/emailLayout.ts` (`appUrl()`, `whoUrl()`), `lib/emails/templates.ts`. Household CTAs go to `https://workit.kervinapps.com/who`. Scoreboard CTA goes to `/admin`. Welcome includes iPhone Safari **Add to Home Screen** steps.
- Dedupe: `lib/emails/send.ts` `claimAndSend` inserts `email_sends (template, dedupe_key)` unique.
- Triggers:
  - Admin creates user → welcome (`queueWelcomeEmail` via `after()`)
  - Session marked complete → `checkAndAwardBadges` in the PUT (returned to the finish takeover, plus `{ bonus, bonusCount, optionalLbs, kickerLbs }` for bonus / optional) + recap (week/program folded in) + badge mail for streak/weight/perfect_week/total_workouts only
  - Netlify `netlify/functions/workit-mail-cron.mts` daily `0 12 * * *` UTC (8am Eastern in EDT) POSTs `/api/cron/mail`
  - Nudges: Mon/Tue/Thu/Fri if they still owe a workout; resume mail any day if a session is open; skip if already trained that NY date
  - Scoreboard: Mondays only, to `WORKIT_SCOREBOARD_TO` (Kevin). Each athlete’s mail includes Best day / Total weight ranking, their Vs the house standing (weight + reps), the household table, plus the bonus honor roll (unique weeks) and the optional honor roll (unique weeks with 4 warmups + 4 cooldowns)
  - Talk to me note → Kevin immediately (`WORKIT_SCOREBOARD_TO` / `leacock.kervin@gmail.com`). Thumbs and stars are digest-only from `/admin/feedback`
- Manual: `/admin/mail`, `npm run mail:release` (household emails; `CURRENT_RELEASE.onlyAthletes` limits the list when set), `npm run mail:scoreboard`. `/document` **always** rewrites `lib/emails/currentRelease.ts` in Master Workit drill-sergeant user-tone and runs `mail:release`.
- Env: see `.env.example`. Set the same keys on the **Netlify** site (Production).

**Path alias**: `@/*` → repo root.

## Working in this repo

- Read `node_modules/next/dist/docs/` before writing Next.js code (`AGENTS.md`).
- Browser / QA: use household user **Test** (PIN `0000`). Do not log sets or start sessions as Kevin.
- New logged-in routes: middleware already blocks. Exempt only by editing `middleware.ts`. Admin-only: `requireAdmin`.
- `next.config.ts` is the active config (`serverExternalPackages: ["nodemailer"]`). `next.config.js` still has PWA header helpers; `netlify.toml` is the deploy config (`@netlify/plugin-nextjs`).
