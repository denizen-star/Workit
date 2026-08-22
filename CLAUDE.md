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

**Database**: `lib/db.ts` `query(sql, params)` via `@planetscale/database` HTTP `connect()`. Schema in `database/schema.sql` (users, workout_sessions, exercise_sets, badges, user_badges, daily_stats, exercises, coach_voices, coach_lines). Incremental SQL is applied by hand: `migrate-pin.sql`, `migrate-timing.sql`, `migrate-email.sql` (`email_sends` dedupe table), `migrate-tone.sql` (`users.coach_tone`; already on prod — re-run = duplicate column), `migrate-sound.sql` (`users.sound_on`), `migrate-badges-20.sql` (20 extra badge rows), `migrate-coach-lines.sql` (`coach_voices` + `coach_lines`; no per-user last-line table), `migrate-workout-mode.sql` (`workout_sessions.workout_mode` gym/travel + Travel Survivor copy), `migrate-app-events-user.sql` (shared `app_events.user_id` / `user_name` / `user_email`; already on prod — re-run = duplicate column/index), `migrate-feedback.sql` (`feedback` + `session_ratings`; re-run = duplicate table). No migration runner. `users.coach_tone` stays `master`/`sergeant`. Lines/descriptions live in those two tables; `GET /api/coach-catalog` hydrates the client. Shuffle is in-memory only. Code banks in `lib/coachLines.ts` / `lib/coachCatalog.ts` are fallback if the tables are empty.

**Workout program is static**: `lib/workoutData.ts` is the 6-week gym plan (Week 2 is gym, not a travel week). Travel is a per-session mode: `lib/travelExercises.ts` substitutions via `applyWorkoutMode()`. Home **Start Workout** POSTs `workout_mode=gym`. Select Workout shows a Gym/Travel pill on unstarted days; resume locks the started mode; completed days hide the pill; Restart returns to Start so they can pick again. Session column `workout_sessions.workout_mode` (`gym`|`travel`). Travel Survivor (`travel_week`) = 4 completed travel-mode sessions. DB also stores logged sets plus the `exercises` catalog (images/video). Media maps: `lib/exerciseImages.ts`, `lib/exerciseMedia.ts`.

**Routes**:
- `app/page.tsx` — backup redirect to `/who` (middleware usually handles `/`)
- `app/home/page.tsx` — dashboard (scoreboard folded, Achievements folded). Stat cards + progress charts show you / household avg of others who finished a workout in the last 7 days (`GET /api/stats` `household`; null if nobody else trained). Enjoyment charts if the athlete has session ratings
- `app/workout/page.tsx` — logging. Finish and quit require 1–5 stars (`POST /api/session-ratings`). Exercise thumbs via `ExerciseThumbs`
- `app/who/page.tsx` — profile picker + PIN
- `app/admin/layout.tsx` — shared chrome: Dashboard back, title, hamburger
- `app/admin/page.tsx` — redirects to `/admin/analytics`
- `app/admin/analytics/page.tsx` — Kevin-only Traffic charts + people (name/email)
- `app/admin/users/page.tsx` — household users; Add stays on this page
- `app/admin/feedback/page.tsx` — Kevin-only notes, thumbs, household enjoyment
- `app/admin/mail/page.tsx` — mail preview / sample send / run nudges / force scoreboard
- Admin hamburger (home + admin chrome): Analytics, Users, Feedback, Mail
- `app/api/*/route.ts` — one file per resource (`GET /api/scoreboard?period=7|30|all`, `GET /api/stats` (includes `household`), `GET /api/coach-catalog`, `GET /api/ratings/stats`, `GET|POST /api/feedback`, `POST /api/session-ratings`, `GET /api/admin/analytics` are session-gated; analytics / admin feedback / household ratings also `requireAdmin`)
- `POST /api/analytics/event` — **not** session-gated; production only; stamps `user_*` from session when present
- `app/api/cron/mail` — GET/POST; **not** session-gated; requires `Authorization: Bearer $CRON_SECRET`

**Telemetry** (production only, `APP_NAME=workit`): papamkt-style ingest to shared PlanetScale `app_events`. Client: `lib/analytics.ts` + `AnalyticsProvider` in root layout. Server: `lib/trackServerEvent.ts`. Identity stamped server-side (`user_id` / `user_name` / `user_email`). Name/email never go in `page_url` / `cta_type` / `device_info`. `/who` taps fire `who_pick` with the tapped name in `article_context` only. kervinapps.com dashboard must not SELECT `user_*`. Identified view is `/admin/analytics`.

**Email** (Zoho SMTP, same stack as hit-list/Gowanus):
- Client: `lib/mailClient.ts` (nodemailer). `EMAIL_ENABLED` empty/true sends; SMTP missing → skip. From display: `voiceFromName()` from `coach_voices` (fallback Master Tom Iron / Luna Meadows). Every send BCCs `info@kervinapps.com`.
- Layout/templates: `lib/emailLayout.ts` (`appUrl()`, `whoUrl()`), `lib/emails/templates.ts`. Household CTAs go to `https://workit.kervinapps.com/who`. Scoreboard CTA goes to `/admin`. Welcome includes iPhone Safari **Add to Home Screen** steps.
- Dedupe: `lib/emails/send.ts` `claimAndSend` inserts `email_sends (template, dedupe_key)` unique.
- Triggers:
  - Admin creates user → welcome (`queueWelcomeEmail` via `after()`)
  - Session marked complete → `checkAndAwardBadges` in the PUT (returned to the finish takeover) + recap (week/program folded in) + badge mail for streak/weight/perfect_week/total_workouts only
  - Netlify `netlify/functions/workit-mail-cron.mts` daily `0 12 * * *` UTC (8am Eastern in EDT) POSTs `/api/cron/mail`
  - Nudges: Mon/Tue/Thu/Fri if they still owe a workout; resume mail any day if a session is open; skip if already trained that NY date
  - Scoreboard: Mondays only, to `WORKIT_SCOREBOARD_TO` (Kevin)
  - Talk to me note → Kevin immediately (`WORKIT_SCOREBOARD_TO` / `leacock.kervin@gmail.com`). Thumbs and stars are digest-only from `/admin/feedback`
- Manual: `/admin/mail`, `npm run mail:release` (all household emails), `npm run mail:scoreboard`. `/document` **always** rewrites `lib/emails/currentRelease.ts` in Master Tom Iron drill-sergeant user-tone and runs `mail:release`.
- Env: see `.env.example`. Set the same keys on the **Netlify** site (Production).

**Path alias**: `@/*` → repo root.

## Working in this repo

- Read `node_modules/next/dist/docs/` before writing Next.js code (`AGENTS.md`).
- New logged-in routes: middleware already blocks. Exempt only by editing `middleware.ts`. Admin-only: `requireAdmin`.
- `next.config.ts` is the active config (`serverExternalPackages: ["nodemailer"]`). `next.config.js` still has PWA header helpers; `netlify.toml` is the deploy config (`@netlify/plugin-nextjs`).
