# Feature Implementation Plan

**Overall Progress:** `85%`

## TLDR

Two packs (**The OG**, **Gowanus**) on one app. Everyone signs in at `/login` (email + PIN). New Gowanus people use an unbranded `/join?h=gowanus` wizard (intro, form + waiver checkbox, PIN), then a verify mail before Home. Invites stay in the house that sent them (`/join?h=…&claim=…`). Existing athletes accept the waiver on an optional “Update your profile.” Live host becomes **https://workitapp.fit**. Kevin is one row in both houses and switches in the menu.

## Critical Decisions

- **Houses this project:** `og` (The OG, invite/claim only) and `gowanus` (public `/join?h=gowanus`). Factory and `&c=` join codes later.
- **One person, one row:** email unique app-wide; display name unique per house. Kevin = id 1, admin of both, volume on every board he belongs to. Last house used after login. Gowanus has its own Test.
- **Doors:** `/login` all sign-in. `/join` empty or `/join?h=og` without claim → `/login`. `/` and `/who` → Home if session else `/login`. No `/gowanus` route. Existing email on join → `/login`.
- **Wizard:** Gen Z intro (draft in code) → form (first, last, email, display name, optional lb, optional phone, circle-crop photo) + waiver link (sheet) + required checkbox → PIN. Draft on the phone. No row until PIN. New Gowanus: magic link; `/login` until verified (“email has not been verified”). Claim/invite: no magic link. New Gowanus coach **Luna**. Welcome + Kevin notify. Waiver URL also in welcome mail.
- **Alias vs first name:** `display_name` is the **alias**. Coach `{name}`, mail fill, and spoken address use **alias, else first name**.
- **Edit profile:** menu Edit profile can change **all new fields**, including photo (same circle-crop). First-time **Update your profile** after login is the same fields (optional) plus required waiver checkbox.
- **Waiver:** store exact text + timestamp. Re-sign on text change later. Existing PIN users: Update your profile (all fields optional) but checkbox required.
- **Isolation:** scoreboard, belts, week lock, You vs leader, Invite filter to **current** house. Invite from a house stays there. Same 48-week program.
- **How-to:** new Gen Z page; Home banner until **5 finished workouts**.
- **Host:** `APP_URL` / `LIVE_APP_URL` → `https://workitapp.fit`. DNS runbook `docs/DOMAIN_WORKITAPP_FIT.md`. Redirect workit.kervinapps.com after primary is live.
- **Out of scope:** house factory UI, secret join codes, waiver re-accept policy, branded `/gowanus` wizard, name-tap login.

## Tasks:

- [x] 🟩 **Step 1: Schema**
  - [x] 🟩 `households` + `household_members`.
  - [x] 🟩 Seed The OG and Gowanus. Kevin + Gowanus Test SQL in migrate.
  - [x] 🟩 New `users` columns. `database/schema.sql` updated.
  - [ ] 🟥 Hand SQL on PlanetScale (`database/migrate-households.sql`).

- [x] 🟩 **Step 2: House context**
  - [x] 🟩 `last_household_id` + `PATCH /api/me` household switch.
  - [x] 🟩 Helpers in `lib/household.ts`.
  - [x] 🟩 Scoreboard / stats / belts / honor rolls filtered by house.
  - [x] 🟩 Menu switch The OG / Gowanus; reload Home.

- [x] 🟩 **Step 3: `/login` + middleware**
  - [x] 🟩 Email + PIN; unverified blocked.
  - [x] 🟩 Public `/login`, `/join`, `/waiver`, `/api/auth`, `/api/join`.
  - [x] 🟩 `/` and `/who` → Home or `/login`.

- [x] 🟩 **Step 4: `/join` wizard**
  - [x] 🟩 Intro → form + waiver → PIN. Draft in localStorage.
  - [x] 🟩 Public Gowanus create (Luna, unverified). Claim updates + session.
  - [x] 🟩 Photo crop. Edit profile all new fields.
  - [x] 🟩 `athleteCallName`.

- [x] 🟩 **Step 5: Waiver + existing athletes**
  - [x] 🟩 `lib/waiver.ts` + `/waiver` + Home gate.
  - [x] 🟩 Waiver URL in welcome / verify mail.

- [x] 🟩 **Step 6: Verify mail**
  - [x] 🟩 `/login?verify=` + `GET/POST /api/auth/verify`.

- [x] 🟩 **Step 7: How to use**
  - [x] 🟩 `/how` + Home banner until 5 finishes.

- [x] 🟩 **Step 8: Domain workitapp.fit**
  - [ ] 🟥 You: DNS per `docs/DOMAIN_WORKITAPP_FIT.md`.
  - [x] 🟩 `LIVE_APP_URL` and `.env.example`.
  - [ ] 🟥 Netlify primary + redirect old host. Set Production `APP_URL=https://workitapp.fit`.

- [ ] 🟥 **Step 9: QA**
  - [ ] 🟥 Test as **Test** on The OG (PIN `0000`). Do not log sets as Kevin.
  - [ ] 🟥 Apply `migrate-households.sql` on PlanetScale before prod.
