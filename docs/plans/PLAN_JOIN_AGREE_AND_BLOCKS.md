# Feature Implementation Plan — Join agree screen, device & account blocks, code of conduct

**Overall Progress:** `100%`

## TLDR
Add a full-screen **agree** step to `/join` (after the intro) where every joiner confirms they are 18+ and train at their own risk. Tapping **Under 18 / Pass** blocks that browser from signing up (cookie + localStorage, backed by a server row), with a one-time Request access form that Kevin can clear from Admin → Users. Kevin can also block existing athlete accounts. Add a Code of Conduct section to the waiver.

## Critical Decisions
- **Agree step placement:** `intro` → `agree` → `form` → `pin` → `confirm` → `wait`. Everyone who joins sees it (public + invite claims). A resumed draft always goes back through it; the confirmation is never saved in the draft.
- **Progress bar:** 4 stages — **Confirm · Details · PIN · Done**.
- **Buttons:** **I confirm** and **Under 18 / Pass**, both gold. This breaks the "gold = take this action" rule on purpose, on this screen only.
- **Server record:** `users.adult_risk_confirmed_at` is stamped on insert and on invite claim. `POST /api/join` returns 400 without `adultRiskConfirmed: true`.
- **Device block = server row + signed cookie + localStorage flag.** You can't delete a cookie from someone else's browser, so the server row is what makes admin clearing possible. Middleware only checks the cookie (no DB call per request).
- **Device-block scope:** only `/join` and public pages (`/`, `/who`, `/faq`, `/waiver`) plus `POST /api/join` are blocked. `/login`, `/api/auth/*` and signed-in use keep working.
- **Self-clearing:** `/blocked` asks the server for its status on load. If the block was cleared, it deletes its own cookie and localStorage flag and goes to `/join`.
- **Access request:** email + note, one per device. Stored on the block row, emails Kevin right away (same path as Talk to me), and shows in admin.
- **Account block = `users.blocked_at`.** Login is refused, `getCurrentUser` returns null so open sessions die on their next request, and that browser also gets the device-block cookie. A blocked account's `/blocked` screen shows **only a dumbbell**, with no text and no request form.
- **Admin can't block id 1.**
- **Blocked accounts stay on every board.** No board query changes.
- **Blocked accounts get no automated mail:** add `blocked_at IS NULL` to recipient queries.
- **Re-join with a blocked email** just fails through today's `exists` → `/login` path. No new message.
- **Code of Conduct:** a new waiver section. New joiners sign the new text; existing signatures stand (the waiver already says a change doesn't force a re-sign).

## Tasks:

- [x] 🟩 **Step 1: Migrations** (applied on PlanetScale 2026-09-27 via `scripts/apply-migration.ts`; columns + table verified)
  - [x] 🟩 `database/migrate-adult-confirm.sql` — `users.adult_risk_confirmed_at DATETIME NULL`
  - [x] 🟩 `database/migrate-user-blocked.sql` — `users.blocked_at DATETIME NULL`
  - [x] 🟩 `database/migrate-device-blocks.sql` — `device_blocks` (`id`, `user_id` NULL = Pass tap / set = account block, `created_at`, `request_email`, `request_note`, `requested_at`, `cleared_at`)
  - [x] 🟩 Mirror all three in `database/schema.sql`

- [x] 🟩 **Step 2: Code of Conduct in the waiver**
  - [x] 🟩 Add a numbered **Code of Conduct** section to `WAIVER_TEXT` in `lib/waiver.ts`, in the same near-legal voice: treat members with respect; no harassment or abusive content; log only real training; don't post other people's photos or share their information; one account per person; Operator may block or remove accounts that break these rules (ties to §5). Renumber the sections after it.
  - [x] 🟩 Bump the effective date

- [x] 🟩 **Step 3: Device-block helpers** — new `lib/deviceBlock.ts`
  - [x] 🟩 Cookie name + sign/verify using `jose` and `AUTH_SECRET`, same as `lib/session.ts`; long max-age, httpOnly
  - [x] 🟩 `createDeviceBlock(userId?)`, `deviceBlockStatus(id)`, `recordAccessRequest(id, email, note)` (refused if one was already sent), `clearDeviceBlock(id)`
  - [x] 🟩 Shared localStorage key constant for the client

- [x] 🟩 **Step 4: Middleware**
  - [x] 🟩 A valid device-block cookie on `/join`, `/`, `/who`, `/faq`, `/waiver` → redirect to `/blocked`; on `POST /api/join` → 403 JSON
  - [x] 🟩 Let `/blocked` and `/api/device-block` through without a session

- [x] 🟩 **Step 5: `/api/device-block` route** (public)
  - [x] 🟩 `POST {action:'pass'}` → create the row, set the cookie, fire the `join_pass` server event (`lib/trackServerEvent.ts`)
  - [x] 🟩 `GET` → `{ kind: 'device' | 'account', requested, cleared }`; when cleared, also delete the cookie
  - [x] 🟩 `POST {action:'request', email, note}` → save once, then mail Kevin (`WORKIT_SCOREBOARD_TO`, `info@` From, same as the Talk to me note)

- [x] 🟩 **Step 6: Join agree screen** (`app/join/page.tsx` + `lib/joinCopy.ts`)
  - [x] 🟩 Add `'agree'` to `Step`; `STAGE_LABELS = ['Confirm','Details','PIN','Done']` and remap `STAGE_FOR_STEP`
  - [x] 🟩 Intro **Next** → `agree`; the form's Back → `agree`; `agree`'s Back → `intro`
  - [x] 🟩 Copy constants: headline **Before you join**; yellow sub-heads **18+ only.** / **Your risk.**; large body text (“You must be 18 or older to use Work-It.” / “Workouts and weights are suggestions only. Know your injuries and health limits. Train at your own pace and at your own risk.”)
  - [x] 🟩 **I confirm** → set `adultConfirmed` (in memory only) → `form`. **Under 18 / Pass** → `POST /api/device-block` + set the localStorage flag → `/blocked`
  - [x] 🟩 Draft restore: any saved step past `intro` resumes at `agree`
  - [x] 🟩 On mount, if the localStorage flag is set → `/blocked` (backup for the cookie)

- [x] 🟩 **Step 7: `POST /api/join`**
  - [x] 🟩 Require `adultRiskConfirmed === true` (400 otherwise); stamp `adult_risk_confirmed_at = UTC_TIMESTAMP()` on both the claim UPDATE and the new-user INSERT

- [x] 🟩 **Step 8: `/blocked` page** (`app/blocked/page.tsx`)
  - [x] 🟩 On load `GET /api/device-block`: cleared → remove the localStorage flag → `/join`
  - [x] 🟩 Device kind: “Work-It is for adults 18+.” + Request access form (email + note) → after sending, or if already requested, show “Request sent, we'll review it.” with no form
  - [x] 🟩 Account kind: dumbbell icon only

- [x] 🟩 **Step 9: Account block enforcement** (`lib/auth.ts`, login route)
  - [x] 🟩 `blocked_at` read via a new `guard` select mode in `selectUserRow` (falls back to the old select until the migration exists). `getCurrentUser` returns null for a blocked user and evicts the session on the spot (clears the session cookie, sets the account's block cookie), so every API 401s and the `/login` ↔ `/home` loop can't happen *(built this way instead of a 403 from `requireCurrentUser`: a single choke point that also covers non-`require` callers)*
  - [x] 🟩 `GET /api/me` (via `getCurrentUserOrBlocked`) returns `{ blocked: true }` 403; `AppMenu` sends the page to `/blocked`
  - [x] 🟩 `POST /api/auth/login`: blocked account → no session, set the device-block cookie, return `{ blocked: true }`; the login page sends them to `/blocked`

- [x] 🟩 **Step 10: Stop automated mail to blocked accounts**
  - [x] 🟩 Add `AND blocked_at IS NULL` to recipient queries in `lib/emails/nudge.ts` (nudge + resume + schedule-days ask), `lib/emails/scoreboard.ts`, `scripts/send-release-email.ts`, and the pace-check sender

- [x] 🟩 **Step 11: Admin → Users**
  - [x] 🟩 Each row gets a **Block / Unblock** button (hidden for id 1). New admin API (`requireAdmin`): block sets `blocked_at` + inserts a `device_blocks` row with `user_id`; unblock clears `blocked_at` + sets `cleared_at`. Server refuses id 1
  - [x] 🟩 **Blocks** section on the page: all device + account blocks, **Pending request / All / Cleared** pills (same pattern as Feedback's Open/Done), pending shown first with email, note, date, and a **Clear** button

- [x] 🟩 **Step 12: Docs**
  - [x] 🟩 `CLAUDE.md`: agree step, the three migrations, device/account blocks, `/blocked`, `/api/device-block`, middleware exemptions, admin Blocks section, Code of Conduct
  - [x] 🟩 `docs/WHAT_IS_WORKIT.md`: 18+ / own-risk agreement and Code of Conduct

- [x] 🟩 **Step 13: Verify**
  - [x] 🟩 `npm run build` passes; `tsc` clean; ESLint on every touched file shows only the 7 pre-existing findings (`next lint` no longer exists in this Next)
  - [x] 🟩 Playwright pass against `next start` (email off), 32/32 checks, throwaway user + block rows deleted after. Found and fixed a race: parallel API calls evicted the blocked session before `AppMenu`'s `/api/me`, so the block cookie now carries `account: true` and middleware routes signed-out account-blocked browsers to `/blocked`. Covered: intro → agree → join; Pass → `/blocked` → request once → clear in admin → the browser frees itself; account block on a throwaway user (never Kevin or Test's real data)
