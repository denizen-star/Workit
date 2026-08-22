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

**Auth flow**: Session-based, not NextAuth. `lib/session.ts` issues/verifies an HS256 JWT (`jose`) in the `workit_session` cookie, signed with `AUTH_SECRET` (≥32 chars). `lib/auth.ts` wraps PIN hashing (scrypt), in-memory lockout (resets on redeploy), and `requireCurrentUser`/`requireAdmin`. `middleware.ts` gates every request except static assets (incl. `/sounds/`, `/badges/`, `.wav`), `/api/cron/*`, `/who`, `/api/auth/*`, and `GET /api/users`. `/` redirects: session → `/home`, else `/who`. Other unauthenticated pages → `/who`; unauthenticated APIs → 401 JSON. User id `1` is the sole admin (`ADMIN_USER_ID`).

**Database**: `lib/db.ts` `query(sql, params)` via `@planetscale/database` HTTP `connect()`. Schema in `database/schema.sql` (users, workout_sessions, exercise_sets, badges, user_badges, daily_stats, exercises). Incremental SQL is applied by hand: `migrate-pin.sql`, `migrate-timing.sql`, `migrate-email.sql` (`email_sends` dedupe table), `migrate-tone.sql` (`users.coach_tone`; already on prod — re-run = duplicate column), `migrate-sound.sql` (`users.sound_on`), `migrate-badges-20.sql` (20 extra badge rows). No migration runner.

**Workout program is static**: `lib/workoutData.ts` is the 6-week plan. DB stores logged sessions/sets plus the `exercises` catalog (images/video).

**Routes**:
- `app/page.tsx` — backup redirect to `/who` (middleware usually handles `/`)
- `app/home/page.tsx` — dashboard (scoreboard folded, Achievements folded)
- `app/workout/page.tsx` — logging
- `app/who/page.tsx` — profile picker + PIN
- `app/admin/page.tsx` — household users (Kevin-only)
- `app/admin/mail/page.tsx` — mail preview / sample send / run nudges / force scoreboard
- `app/api/*/route.ts` — one file per resource (`GET /api/scoreboard?period=7|30|all` is session-gated)
- `app/api/cron/mail` — GET/POST; **not** session-gated; requires `Authorization: Bearer $CRON_SECRET`

**Email** (Zoho SMTP, same stack as hit-list/Gowanus):
- Client: `lib/mailClient.ts` (nodemailer). `EMAIL_ENABLED` empty/true sends; SMTP missing → skip. From display: `Master Tom Iron` or `Luna Meadows` via `coachDisplayName` (default Master Tom Iron). Every send BCCs `info@kervinapps.com`.
- Layout/templates: `lib/emailLayout.ts` (`appUrl()`, `whoUrl()`), `lib/emails/templates.ts`. Household CTAs go to `https://workit.kervinapps.com/who`. Scoreboard CTA goes to `/admin`. Welcome includes iPhone Safari **Add to Home Screen** steps.
- Dedupe: `lib/emails/send.ts` `claimAndSend` inserts `email_sends (template, dedupe_key)` unique.
- Triggers:
  - Admin creates user → welcome (`queueWelcomeEmail` via `after()`)
  - Session marked complete → `checkAndAwardBadges` in the PUT (returned to the finish takeover) + recap (week/program folded in) + badge mail for streak/weight/perfect_week/total_workouts only
  - Netlify `netlify/functions/workit-mail-cron.mts` daily `0 12 * * *` UTC (8am Eastern in EDT) POSTs `/api/cron/mail`
  - Nudges: Mon/Tue/Thu/Fri if they still owe a workout; resume mail any day if a session is open; skip if already trained that NY date
  - Scoreboard: Mondays only, to `WORKIT_SCOREBOARD_TO` (Kevin)
- Manual: `/admin/mail`, `npm run mail:release` (all household emails), `npm run mail:scoreboard`. `/document` **always** rewrites `lib/emails/currentRelease.ts` in Master Tom Iron drill-sergeant user-tone and runs `mail:release`.
- Env: see `.env.example`. Set the same keys on the **Netlify** site (Production).

**Path alias**: `@/*` → repo root.

## Working in this repo

- Read `node_modules/next/dist/docs/` before writing Next.js code (`AGENTS.md`).
- New logged-in routes: middleware already blocks. Exempt only by editing `middleware.ts`. Admin-only: `requireAdmin`.
- `next.config.ts` is the active config (`serverExternalPackages: ["nodemailer"]`). `next.config.js` still has PWA header helpers; `netlify.toml` is the deploy config (`@netlify/plugin-nextjs`).
