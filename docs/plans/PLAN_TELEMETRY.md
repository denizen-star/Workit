# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Add portfolio telemetry to Work-It so Kevin can see household behavior. Events write to shared PlanetScale `app_events` (`app_name = workit`) with server-stamped `user_id` / `user_name` / `user_email`. kervinapps.com shows Work-It as anonymous traffic only. Identified papamkt-style Traffic charts live on a Kevin-only Work-It admin screen. Production only.

## Critical Decisions

- **Write path:** papamkt Next.js pattern (`POST /api/analytics/event`, client tracker, IP geo) — not KervinApps static `analytics.js` / Netlify functions.
- **Identity:** `ALTER` shared `app_events` with `user_id`, `user_name`, `user_email`. Stamp from `getCurrentUser()` on the server. Client never sends name or email. No email → name only. Pre-login rows leave all three null.
- **PII split:** Name/email only in those three columns. Never copy them into `page_url`, `cta_type`, or `device_info`. KervinApps dashboard must not SELECT or render them. Work-It `/admin/analytics` (`requireAdmin`, user id 1) is the identified view.
- **`/who` tap:** Fire `who_pick` with tapped household name in `article_context` only (not `user_*`).
- **Host:** `workit.kervinapps.com` only. No `work-it` alias work.
- **When:** Client tracker no-ops unless `NODE_ENV === 'production'`.
- **Charts:** papamkt **Traffic** only (funnel, sessions/pageviews, weekday/hour EST, device, geo, CTA/events, session depth, exit rate, people rows + person filter). No shop/Business/cart charts.
- **Events:** `page_view`, `page_exit`, `scroll_depth`, `who_pick`, `login`, `logout`, `workout_start`, `workout_resume`, `workout_restart`, `workout_complete`, `workout_mode` (gym/travel via `cta_type` or `article_context`), `set_logged`, `badge_awarded`, `profile_edit`, `admin_page_view`, `admin_mail` (preview/sample/nudge/scoreboard via `cta_type`), `admin_user` (create/edit/delete via `cta_type`).

## Tasks:

- [x] 🟩 **Step 1: Schema + env**
  - [x] 🟩 Add `database/migrate-app-events-user.sql`: `user_id INT NULL`, `user_name VARCHAR(255) NULL`, `user_email VARCHAR(255) NULL`, index `(app_name, user_id, timestamp)`.
  - [x] 🟩 Apply the ALTER on PlanetScale `kervapps` by hand (same as other Work-It migrates).
  - [x] 🟩 Set Netlify `APP_NAME=workit`. Document in `.env.example` (no local tracking required).

- [x] 🟩 **Step 2: Ingest (papamkt-style write path)**
  - [x] 🟩 Read `node_modules/next/dist/docs/` before adding the route / client provider.
  - [x] 🟩 Port/adapt `lib/ipGeolocation.ts`, `lib/deviceCollector.ts`, `lib/analytics.ts`, `lib/trackServerEvent.ts` from papamkt. `trackEvent` no-ops when not production.
  - [x] 🟩 Add `POST /api/analytics/event`: allow listed event types; geo + UA enrichment; stamp `user_*` from `getCurrentUser()` when a session exists; persist `visitor_id` / `page_title` / `device_type` / `os` / `browser` like papamkt.
  - [x] 🟩 Exempt `/api/analytics/event` in `middleware.ts` so `/who` can fire without a session.

- [x] 🟩 **Step 3: Mount tracker + instrument actions**
  - [x] 🟩 `AnalyticsProvider` + `useAnalytics` in root layout (production only). Categories from path: `who`, `home`, `workout`, `admin`, `admin-mail`.
  - [x] 🟩 `/who`: `who_pick` on name tap (`article_context` = name). `login` after PIN / set-pin success.
  - [x] 🟩 Client CTAs: logout (`AppMenu`), start/resume/restart/complete + gym/travel (`home` / `workout`), profile save (`EditProfileModal`).
  - [x] 🟩 Server events via `trackServerEvent` (still stamp `user_*`): set save (`/api/exercises`), badge awards + complete (`PUT /api/sessions`), admin mail actions (`/api/admin/mail`), household user create/edit/delete (`/api/users`).
  - [x] 🟩 Admin page views: `/admin` and `/admin/mail` (category + `admin_page_view` or path category is enough if page_view already fires).

- [x] 🟩 **Step 4: Work-It admin analytics (Kevin-only)**
  - [x] 🟩 `GET /api/admin/analytics` gated by `requireAdmin`. Filter `app_name = workit`. Ranges: today, yesterday, 7d, 30d, month vs month, all. EST grouping like papamkt.
  - [x] 🟩 Queries: people (name, email or blank, counts, recent events), person filter, funnel (sessions → page views → login → start → complete), sessions/pageviews daily + cumulative, weekday/hour averages, device + geo filters/breakdowns, CTA/event distribution, session depth, exit rate by page.
  - [x] 🟩 `/admin/analytics` page in existing Work-It admin look (gold/dark). Link from `/admin`. Household users never see it.

- [x] 🟩 **Step 5: kervinapps.com dashboard (anonymous only)**
  - [x] 🟩 In KervinApps repo: add a `workit` display label on the analytics dashboard app map.
  - [x] 🟩 Do not add `user_id` / `user_name` / `user_email` to `analytics-data.js` (or any other kervinapps.com tracker/dashboard query).
