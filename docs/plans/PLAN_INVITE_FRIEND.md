# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Let any signed-in athlete except Test invite a friend with full name + email. The friend is created with no PIN, stays off `/who` until they open a never-expiring claim link from mail and create their PIN, then joins this household roster and scoreboard. Inviter sees their guest list and can resend. Kevin is mailed on each new invite. Admin Add is unchanged.

## Critical Decisions

- **Same household, no house table:** Friend joins this roster. Store `invited_by` only so a later multi-house split is possible. No `household_id`.
- **Claim is a secret link, not typing email:** `/who` already shows emails. Invite mail carries a token. Unclaimed users are hidden from the public picker. `POST /api/auth/set-pin` requires that token. Link never expires until PIN is set or a resend rotates the token.
- **Who can invite:** Any signed-in athlete except Test (`isTestUserName`). Cap 100 = current rows with `invited_by = you` (delete frees a slot). Resend does not count.
- **Buttons:** Home text link under Start/Select (same weight as Restart) plus hamburger item. Shared invite modal with guest list + Resend on Waiting.
- **Names:** Case-insensitive trimmed full name must be unique on invite, Edit profile, and Admin edit (you may keep your own name). Email stays unique.
- **Mail:** New invite welcome (create PIN, inviter full name + email, claim CTA). Admin welcome stays “punch your PIN”. Kevin gets a notify mail on new invite (`WORKIT_SCOREBOARD_TO`), plus usual ops BCC.
- **Nudges:** Skip users with `pin_hash` null. After they have a PIN they get normal start-week-1 nudges.
- **Out of scope:** Multi-household, changing Admin Add (still requires Kevin’s PIN), Test inviting.

## Tasks:

- [x] 🟩 **Step 1: Schema**
  - [x] 🟩 Add `database/migrate-invite.sql`: `users.invited_by` (INT NULL), `users.invite_token` (VARCHAR unique, hashed), `users.invited_at` (TIMESTAMP NULL).
  - [x] 🟩 Apply on PlanetScale by hand (same as other Work-It migrates).

- [x] 🟩 **Step 2: Shared helpers**
  - [x] 🟩 Name uniqueness helper in `lib/profile.ts` (trim, case-insensitive, exclude self on edit).
  - [x] 🟩 Invite token generate/hash/verify + claim URL helper next to `whoUrl()`.
  - [x] 🟩 Use helpers on invite create and on `PATCH /api/me` + `PATCH /api/users/:id`.

- [x] 🟩 **Step 3: Invite API**
  - [x] 🟩 Read `node_modules/next/dist/docs/` before adding routes.
  - [x] 🟩 `POST /api/invite` via `requireCurrentUser`: reject Test; name + email required; 409 on duplicate email; 409 on duplicate name with differentiate copy; 400 at 100 guests; insert `pin_hash` NULL, `invited_by`, hashed token, `invited_at`; queue invite welcome + Kevin notify.
  - [x] 🟩 `GET /api/invite`: current user’s guests (name, email, has_pin, invited_at).
  - [x] 🟩 `POST /api/invite/resend`: athlete may resend own Waiting guest (new token, same row, not a new cap slot). Admin may resend any Waiting guest.

- [x] 🟩 **Step 4: Claim + hide unclaimed**
  - [x] 🟩 Public `GET /api/users`: only rows with a PIN. Admin session still gets everyone (Users page needs Waiting).
  - [x] 🟩 `GET /api/auth/claim?token=`: resolve Waiting user for the PIN pad (id, name, email). Invalid token → 404.
  - [x] 🟩 `/who?claim=`: skip picker, create-PIN → confirm → `POST /api/auth/set-pin` with token. On success clear `invite_token`.
  - [x] 🟩 Reject `set-pin` without a valid token. After PIN, they show on `/who` and The house.

- [x] 🟩 **Step 5: Mail + nudges**
  - [x] 🟩 Invite welcome: create your PIN (not punch), inviter full name + email, claim CTA, iPhone home-screen steps. Admin `queueWelcomeEmail` unchanged.
  - [x] 🟩 Kevin notify on new invite only (inviter + invitee name/email), `sendNow` to `WORKIT_SCOREBOARD_TO`.
  - [x] 🟩 Add `invite` to `MAIL_TEMPLATES` so `/admin/mail` can preview.
  - [x] 🟩 Daily nudges/resume: skip `pin_hash` IS NULL.

- [x] 🟩 **Step 6: UI**
  - [x] 🟩 `InviteFriendModal`: name, email, submit; guest list Waiting / On the roster; Resend on Waiting.
  - [x] 🟩 Home: “Invite a friend” text link under the Start/Select row (Restart weight). Hamburger: same item for every athlete except Test.
  - [x] 🟩 Admin Users: Resend on no-PIN rows.

- [x] 🟩 **Step 7: Browser check**
  - [x] 🟩 As Test (PIN `0000`): no invite link/menu item; do not log sets as Kevin.
  - [x] 🟩 Invite as a non-Test athlete: mail path, guest list, duplicate name/email, claim link sets PIN, then profile appears on `/who`.
  - [x] 🟩 Resend rotates the old link. Admin resend works. Edit profile / Admin edit block a taken name.
